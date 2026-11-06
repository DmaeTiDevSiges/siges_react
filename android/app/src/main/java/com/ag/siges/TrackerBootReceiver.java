package com.ag.siges;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import androidx.core.content.ContextCompat;

/**
 * Retoma o rastreamento quando o celular liga (BOOT_COMPLETED) ou quando o
 * APK é atualizado (MY_PACKAGE_REPLACED), se ele estava ativo antes.
 *
 * Só religa com a permissão "Permitir o tempo todo" (ACCESS_BACKGROUND_LOCATION):
 * sem ela o Android não deixa iniciar um foreground service de localização
 * a partir do segundo plano. Nesse caso o rastreamento volta quando o
 * usuário abrir o app.
 *
 * A regra de negócio (disponível ou em visita) continua valendo: se o
 * usuário estiver indisponível, fn_tracker_report_location devolve 'paused'
 * e o serviço se desliga sozinho.
 */
public class TrackerBootReceiver extends BroadcastReceiver {

    private static final String TAG = "TrackerBootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            return;
        }

        boolean enabled = context
                .getSharedPreferences(LocationForegroundService.PREFS, Context.MODE_PRIVATE)
                .getBoolean(LocationForegroundService.PREF_ENABLED, false);
        if (!enabled) {
            Log.i(TAG, action + " — tracking was not active, nothing to restore");
            return;
        }

        if (!hasPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
                && !hasPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION)) {
            Log.w(TAG, action + " — no location permission, skipping");
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                && !hasPermission(context, Manifest.permission.ACCESS_BACKGROUND_LOCATION)) {
            Log.w(TAG, action + " — no background location permission, will resume when app opens");
            return;
        }

        Intent serviceIntent = new Intent(context, LocationForegroundService.class);
        serviceIntent.setAction(LocationForegroundService.ACTION_RESTORE);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            Log.i(TAG, action + " — tracking restored");
        } catch (Exception e) {
            Log.w(TAG, action + " — could not restore tracking", e);
        }
    }

    private static boolean hasPermission(Context context, String permission) {
        return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED;
    }
}
