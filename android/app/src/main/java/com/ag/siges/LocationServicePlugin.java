package com.ag.siges;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * LocationServicePlugin
 *
 * Plugin Capacitor que expõe o LocationForegroundService ao Javascript/React.
 *
 * Uso no JS (hooks/useLocationTracker.ts):
 *   await plugin.start({ userId, supabaseUrl, supabaseKey, trackerToken, intervalSeconds, distanceMeters });
 *   await plugin.stop();
 *   await plugin.getStatus();               // permissões, bateria, fabricante
 *   await plugin.requestIgnoreBatteryOptimizations();
 *   await plugin.openAppSettings();
 */
@CapacitorPlugin(
        name = "LocationService",
        permissions = {
                @Permission(strings = { Manifest.permission.ACCESS_BACKGROUND_LOCATION }, alias = "backgroundLocation")
        }
)
public class LocationServicePlugin extends Plugin {

    private static final String TAG = "LocationServicePlugin";

    /** Quando o pedido de "Permitir o tempo todo" começou (para saber se o sistema mostrou algo). */
    private long backgroundRequestStartedAt = 0;

    @PluginMethod
    public void start(PluginCall call) {
        String userId        = call.getString("userId");
        String supabaseUrl   = call.getString("supabaseUrl");
        String supabaseKey   = call.getString("supabaseKey");
        String trackerToken  = call.getString("trackerToken");
        int    intervalSec   = call.getInt("intervalSeconds", 60);
        float  distanceM     = call.getFloat("distanceMeters", 50f);

        if (userId == null || supabaseUrl == null || supabaseKey == null || trackerToken == null) {
            call.reject("userId, supabaseUrl, supabaseKey and trackerToken are required");
            return;
        }

        Context ctx = getContext();
        Intent intent = new Intent(ctx, LocationForegroundService.class);
        intent.setAction(LocationForegroundService.ACTION_START);
        intent.putExtra(LocationForegroundService.EXTRA_USER_ID,       userId);
        intent.putExtra(LocationForegroundService.EXTRA_SUPABASE_URL,  supabaseUrl);
        intent.putExtra(LocationForegroundService.EXTRA_SUPABASE_KEY,  supabaseKey);
        intent.putExtra(LocationForegroundService.EXTRA_TRACKER_TOKEN, trackerToken);
        intent.putExtra(LocationForegroundService.EXTRA_INTERVAL_SEC,  intervalSec);
        intent.putExtra(LocationForegroundService.EXTRA_DISTANCE_M,    distanceM);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(intent);
            } else {
                ctx.startService(intent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Could not start LocationForegroundService", e);
            call.reject("Could not start location service: " + e.getMessage());
            return;
        }

        Log.i(TAG, "LocationForegroundService started for user " + userId);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Context ctx = getContext();
        // Desliga mesmo que o serviço não esteja vivo (para não voltar no boot).
        ctx.getSharedPreferences(LocationForegroundService.PREFS, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(LocationForegroundService.PREF_ENABLED, false)
                .remove(LocationForegroundService.PREF_TOKEN)
                .apply();
        try {
            ctx.stopService(new Intent(ctx, LocationForegroundService.class));
        } catch (Exception e) {
            Log.w(TAG, "stopService failed", e);
        }
        Log.i(TAG, "LocationForegroundService stop requested");
        call.resolve();
    }

    /** Estado das permissões/otimizações que afetam o rastreamento contínuo. */
    @PluginMethod
    public void getStatus(PluginCall call) {
        Context ctx = getContext();
        JSObject ret = new JSObject();
        ret.put("fineLocation", granted(ctx, Manifest.permission.ACCESS_FINE_LOCATION));
        ret.put("backgroundLocation", Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
                || granted(ctx, Manifest.permission.ACCESS_BACKGROUND_LOCATION));
        ret.put("ignoringBatteryOptimizations", isIgnoringBatteryOptimizations(ctx));
        ret.put("trackingEnabled", ctx
                .getSharedPreferences(LocationForegroundService.PREFS, Context.MODE_PRIVATE)
                .getBoolean(LocationForegroundService.PREF_ENABLED, false));
        ret.put("manufacturer", Build.MANUFACTURER);
        ret.put("sdkInt", Build.VERSION.SDK_INT);
        call.resolve(ret);
    }

    /**
     * Abre a tela do sistema com a lista de otimização de bateria, onde o usuário
     * desliga a otimização do SIGES. Não usa ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
     * (pedido direto), que a política da Play Store restringe; se a lista não existir
     * no aparelho, abre os detalhes do app.
     */
    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        Context ctx = getContext();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || isIgnoringBatteryOptimizations(ctx)) {
            JSObject ret = new JSObject();
            ret.put("ignoringBatteryOptimizations", true);
            call.resolve(ret);
            return;
        }
        try {
            Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                fallback.setData(Uri.parse("package:" + ctx.getPackageName()));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(fallback);
            } catch (Exception e2) {
                call.reject("Could not open battery optimization settings");
                return;
            }
        }
        JSObject ret = new JSObject();
        ret.put("ignoringBatteryOptimizations", false);
        call.resolve(ret);
    }

    /**
     * Pede "Permitir o tempo todo" (ACCESS_BACKGROUND_LOCATION).
     *   - Android 11+: o sistema abre DIRETO a tela "Permissões de localização" do
     *     app (sem passar por Informações do app > Permissões).
     *   - Android 10: mostra o diálogo do sistema.
     * Exige a localização "durante o uso" já concedida (o JS garante antes).
     * Retorna { granted, shown }: shown=false indica que o sistema não exibiu nada
     * (ex.: usuário marcou "não perguntar novamente") — aí o JS abre as configurações.
     */
    @PluginMethod
    public void requestBackgroundLocation(PluginCall call) {
        Context ctx = getContext();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
                || granted(ctx, Manifest.permission.ACCESS_BACKGROUND_LOCATION)) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            ret.put("shown", false);
            call.resolve(ret);
            return;
        }
        if (!granted(ctx, Manifest.permission.ACCESS_FINE_LOCATION)
                && !granted(ctx, Manifest.permission.ACCESS_COARSE_LOCATION)) {
            JSObject ret = new JSObject();
            ret.put("granted", false);
            ret.put("shown", false);
            ret.put("needsForeground", true);
            call.resolve(ret);
            return;
        }
        backgroundRequestStartedAt = SystemClock.elapsedRealtime();
        requestPermissionForAlias("backgroundLocation", call, "backgroundLocationCallback");
    }

    @PermissionCallback
    private void backgroundLocationCallback(PluginCall call) {
        long elapsed = SystemClock.elapsedRealtime() - backgroundRequestStartedAt;
        JSObject ret = new JSObject();
        ret.put("granted", granted(getContext(), Manifest.permission.ACCESS_BACKGROUND_LOCATION));
        // Resposta instantânea = o sistema recusou sem mostrar tela/diálogo.
        ret.put("shown", elapsed > 600);
        call.resolve(ret);
    }

    /** Tela de detalhes do app (permissões, bateria, "Permitir o tempo todo"). */
    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Context ctx = getContext();
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + ctx.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open app settings");
        }
    }

    private static boolean granted(Context ctx, String permission) {
        return ContextCompat.checkSelfPermission(ctx, permission) == PackageManager.PERMISSION_GRANTED;
    }

    private static boolean isIgnoringBatteryOptimizations(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
        return pm != null && pm.isIgnoringBatteryOptimizations(ctx.getPackageName());
    }
}
