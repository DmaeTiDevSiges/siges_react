package com.ag.siges;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * LocationServicePlugin
 *
 * Plugin Capacitor que expõe o LocationForegroundService ao Javascript/React.
 *
 * Uso no JS:
 *   const plugin = registerPlugin('LocationService');
 *   await plugin.start({ userId, supabaseUrl, supabaseKey, intervalSeconds, distanceMeters });
 *   await plugin.stop();
 */
@CapacitorPlugin(name = "LocationService")
public class LocationServicePlugin extends Plugin {

    private static final String TAG = "LocationServicePlugin";

    @PluginMethod
    public void start(PluginCall call) {
        String userId        = call.getString("userId");
        String supabaseUrl   = call.getString("supabaseUrl");
        String supabaseKey   = call.getString("supabaseKey");
        int    intervalSec   = call.getInt("intervalSeconds", 60);
        float  distanceM     = call.getFloat("distanceMeters", 50f);

        if (userId == null || supabaseUrl == null || supabaseKey == null) {
            call.reject("userId, supabaseUrl and supabaseKey are required");
            return;
        }

        Context ctx = getContext();
        Intent intent = new Intent(ctx, LocationForegroundService.class);
        intent.setAction(LocationForegroundService.ACTION_START);
        intent.putExtra(LocationForegroundService.EXTRA_USER_ID,      userId);
        intent.putExtra(LocationForegroundService.EXTRA_SUPABASE_URL, supabaseUrl);
        intent.putExtra(LocationForegroundService.EXTRA_SUPABASE_KEY, supabaseKey);
        intent.putExtra(LocationForegroundService.EXTRA_INTERVAL_SEC, intervalSec);
        intent.putExtra(LocationForegroundService.EXTRA_DISTANCE_M,   distanceM);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(intent);
        } else {
            ctx.startService(intent);
        }

        Log.i(TAG, "LocationForegroundService started for user " + userId);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Context ctx = getContext();
        Intent intent = new Intent(ctx, LocationForegroundService.class);
        intent.setAction(LocationForegroundService.ACTION_STOP);
        ctx.startService(intent);
        Log.i(TAG, "LocationForegroundService stop requested");
        call.resolve();
    }
}
