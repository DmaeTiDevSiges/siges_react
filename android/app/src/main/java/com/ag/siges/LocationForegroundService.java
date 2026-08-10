package com.ag.siges;

import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.android.gms.location.ActivityRecognition;
import com.google.android.gms.location.ActivityRecognitionClient;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.gms.location.DetectedActivity;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * LocationForegroundService — Battery-optimized location tracking.
 *
 * Strategy: Activity Recognition (sensor hub) → GPS (adaptive)
 *
 * Activity Recognition (always running, ~0.1% battery):
 *   STILL/TILTING → no GPS, heartbeat only
 *   ON_FOOT       → BALANCED GPS, 10s
 *   IN_VEHICLE    → HIGH_ACCURACY GPS, 5s
 *
 * GPS battery savings:
 *   - Stationary: ~90% savings (GPS off, only heartbeat)
 *   - Walking: ~60% savings (balanced power GPS)
 *   - Driving: same (needs accuracy)
 */
public class LocationForegroundService extends Service {

    private static final String TAG = "LocationFGService";

    public static final String ACTION_START = "com.ag.siges.START_TRACKING";
    public static final String ACTION_STOP  = "com.ag.siges.STOP_TRACKING";
    public static final String ACTION_ACTIVITY_DETECTED = "com.ag.siges.ACTIVITY_DETECTED";

    public static final String EXTRA_USER_ID      = "userId";
    public static final String EXTRA_SUPABASE_URL = "supabaseUrl";
    public static final String EXTRA_SUPABASE_KEY = "supabaseKey";
    public static final String EXTRA_INTERVAL_SEC = "intervalSeconds";
    public static final String EXTRA_DISTANCE_M   = "distanceMeters";
    public static final String EXTRA_ACTIVITY_TYPE = "activityType";
    public static final String EXTRA_CONFIDENCE   = "confidence";

    // Activity Recognition update interval (ms)
    private static final long ACTIVITY_UPDATE_MS = 15_000; // 15 seconds

    private FusedLocationProviderClient fusedClient;
    private ActivityRecognitionClient activityClient;
    private PendingIntent activityPendingIntent;
    private LocationCallback locationCallback;
    private ExecutorService httpExecutor;

    // Config from JS
    private String userId;
    private String supabaseUrl;
    private String supabaseKey;
    private float distanceMeters = 50f;

    // ── Activity Recognition state ──
    // Confidence threshold to act on detected activity
    private static final int CONFIDENCE_THRESHOLD = 50;

    // Current activity
    private int currentActivityType = DetectedActivity.UNKNOWN;
    private int currentConfidence   = 0;

    // Send throttling
    private static final long MIN_SEND_INTERVAL_MS    = 30_000;  // 30s minimum between HTTP sends
    private static final long HEARTBEAT_STILL_MS      = 180_000; // 3 min heartbeat when still
    private static final long HEARTBEAT_MOVING_MS     = 60_000;  // 1 min heartbeat when moving

    private Location lastSentLocation = null;
    private long     lastSentTimeMs   = 0;
    private Location lastGpsLocation  = null;

    // ── Heartbeat timer (keeps tracker_heartbeat_at fresh when GPS is off) ──
    private Handler  heartbeatHandler;
    private Runnable heartbeatRunnable;
    private long     heartbeatStillMs = HEARTBEAT_STILL_MS;

    @Override
    public void onCreate() {
        super.onCreate();
        httpExecutor      = Executors.newSingleThreadExecutor();
        fusedClient       = LocationServices.getFusedLocationProviderClient(this);
        activityClient    = ActivityRecognition.getClient(this);
        heartbeatHandler  = new Handler(Looper.getMainLooper());
        Log.i(TAG, "Service created");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || ACTION_STOP.equals(intent.getAction())) {
            Log.i(TAG, "STOP action received");
            stopSelf();
            return START_NOT_STICKY;
        }

        // Handle activity recognition results forwarded by the receiver
        if (ACTION_ACTIVITY_DETECTED.equals(intent.getAction())) {
            int activityType = intent.getIntExtra(EXTRA_ACTIVITY_TYPE, DetectedActivity.UNKNOWN);
            int confidence   = intent.getIntExtra(EXTRA_CONFIDENCE, 0);
            onActivityDetected(activityType, confidence);
            return START_STICKY;
        }

        // Normal START action
        userId        = intent.getStringExtra(EXTRA_USER_ID);
        supabaseUrl   = intent.getStringExtra(EXTRA_SUPABASE_URL);
        supabaseKey   = intent.getStringExtra(EXTRA_SUPABASE_KEY);
        distanceMeters = intent.getFloatExtra(EXTRA_DISTANCE_M, 50f);

        long intervalSec = intent.getIntExtra(EXTRA_INTERVAL_SEC, 60);
        heartbeatStillMs = Math.max(intervalSec * 1000L, MIN_SEND_INTERVAL_MS);

        Log.i(TAG, "START — userId=" + userId + " dist=" + distanceMeters + "m heartbeat=" + (heartbeatStillMs / 1000) + "s");

        startForegroundWithNotification();
        startActivityRecognition();
        startLocationUpdates();

        return START_STICKY;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Foreground notification
    // ─────────────────────────────────────────────────────────────────────────

    private void startForegroundWithNotification() {
        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, openAppIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        android.app.Notification notification = new NotificationCompat.Builder(this, "siges_location_channel")
                .setContentTitle("SIGES")
                .setContentText("Rastreamento de localização ativo")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setContentIntent(pendingIntent)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(1001, notification);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Activity Recognition (sensor hub — always running, ~0.1% battery)
    // ─────────────────────────────────────────────────────────────────────────

    private void startActivityRecognition() {
        Intent intent = new Intent(this, ActivityRecognitionBroadcastReceiver.class);
        intent.setAction(ActivityRecognitionBroadcastReceiver.ACTION_ACTIVITY_DETECTED);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        activityPendingIntent = PendingIntent.getBroadcast(this, 0, intent, flags);

        try {
            activityClient.requestActivityUpdates(ACTIVITY_UPDATE_MS, activityPendingIntent);
            Log.i(TAG, "Activity Recognition started (interval=" + (ACTIVITY_UPDATE_MS / 1000) + "s)");
        } catch (SecurityException e) {
            Log.e(TAG, "No activity recognition permission", e);
        }
    }

    private void stopActivityRecognition() {
        if (activityPendingIntent != null) {
            try {
                activityClient.removeActivityUpdates(activityPendingIntent);
                Log.i(TAG, "Activity Recognition stopped");
            } catch (Exception e) {
                Log.w(TAG, "Error stopping activity recognition", e);
            }
        }
    }

    /**
     * Called when a new activity is detected by the sensor hub.
     * Maps DetectedActivity types to GPS priorities:
     *   STILL/UNKNOWN/CONFIDENCE_LOW → STATIONARY (GPS off or minimal)
     *   ON_FOOT/WALKING/RUNNING     → SLOW (balanced GPS)
     *   IN_VEHICLE/ON_BICYCLE       → MOVING (high accuracy GPS)
     */
    private void onActivityDetected(int activityType, int confidence) {
        int previousActivity = currentActivityType;
        currentActivityType = activityType;
        currentConfidence   = confidence;

        if (confidence < CONFIDENCE_THRESHOLD) {
            Log.d(TAG, "Activity=" + activityName(activityType) + " conf=" + confidence + "% (below threshold, keeping previous)");
            return;
        }

        Log.i(TAG, "Activity detected: " + activityName(activityType) + " (" + confidence + "%)");

        if (activityType != previousActivity) {
            adaptGpsForActivity(activityType);
        }
    }

    /**
     * Switch GPS priority and interval based on detected activity.
     * This is the core battery optimization:
     *   - STILL: LOW_POWER (antenas + Wi-Fi, 5min) + heartbeat backup
     *   - ON_FOOT: balanced GPS, 10s interval
     *   - IN_VEHICLE: high accuracy GPS, 5s interval
     */
    private void adaptGpsForActivity(int activityType) {
        switch (activityType) {
            case DetectedActivity.STILL:
            case DetectedActivity.UNKNOWN:
                // Low-power: antenas + Wi-Fi a cada 5min (precisão ~100-500m, bateria mínima)
                // Heartbeat timer é backup caso a localização por antenas falhe
                stopHeartbeat();
                requestLocationWithPriority(Priority.PRIORITY_LOW_POWER, 300_000, 120_000);
                startHeartbeat();
                Log.i(TAG, "GPS LOW_POWER — antenas/Wi-Fi (5min) + heartbeat backup");
                break;

            case DetectedActivity.ON_FOOT:
            case DetectedActivity.WALKING:
            case DetectedActivity.RUNNING:
                // Balanced power GPS
                stopHeartbeat();
                requestLocationWithPriority(Priority.PRIORITY_BALANCED_POWER_ACCURACY, 10_000, 5_000);
                Log.i(TAG, "GPS BALANCED — ON_FOOT (10s)");
                break;

            case DetectedActivity.IN_VEHICLE:
            case DetectedActivity.ON_BICYCLE:
                // High accuracy GPS
                stopHeartbeat();
                requestLocationWithPriority(Priority.PRIORITY_HIGH_ACCURACY, 5_000, 2_000);
                Log.i(TAG, "GPS HIGH_ACCURACY — IN_VEHICLE (5s)");
                break;

            case DetectedActivity.TILTING:
                // Transitional — balanced with slightly longer interval
                stopHeartbeat();
                requestLocationWithPriority(Priority.PRIORITY_BALANCED_POWER_ACCURACY, 15_000, 8_000);
                Log.i(TAG, "GPS BALANCED — TILTING (15s)");
                break;

            default:
                // Unknown — balanced fallback
                stopHeartbeat();
                requestLocationWithPriority(Priority.PRIORITY_BALANCED_POWER_ACCURACY, 15_000, 8_000);
                break;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GPS — FusedLocationProvider (adaptive based on Activity Recognition)
    // ─────────────────────────────────────────────────────────────────────────

    private void startLocationUpdates() {
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult result) {
                if (result == null) return;
                Location location = result.getLastLocation();
                if (location == null) return;
                onNewLocation(location);
            }
        };

        // Start with current activity's GPS setting
        adaptGpsForActivity(currentActivityType);
        Log.i(TAG, "Location updates started (activity=" + activityName(currentActivityType) + ")");
    }

    private void requestLocationWithPriority(int priority, long intervalMs, long minIntervalMs) {
        if (fusedClient == null || locationCallback == null) return;

        LocationRequest request = new LocationRequest.Builder(priority, intervalMs)
                .setMinUpdateIntervalMillis(minIntervalMs)
                .setMinUpdateDistanceMeters(0)
                .build();

        try {
            fusedClient.removeLocationUpdates(locationCallback);
            fusedClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper());
        } catch (SecurityException e) {
            Log.e(TAG, "No location permission", e);
        }
    }

    private void removeLocationUpdates() {
        if (fusedClient != null && locationCallback != null) {
            fusedClient.removeLocationUpdates(locationCallback);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Heartbeat timer — keeps tracker_heartbeat_at alive when GPS is off
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Start a periodic timer that sends the last known GPS position to Supabase.
     * This keeps the admin tracker "heartbeat" fresh even when the user is stationary
     * and GPS is turned off to save battery.
     */
    private void startHeartbeat() {
        stopHeartbeat(); // prevent duplicates
        heartbeatRunnable = new Runnable() {
            @Override
            public void run() {
                if (lastGpsLocation != null) {
                    Log.d(TAG, "Heartbeat — sending last known position (lat=" + lastGpsLocation.getLatitude() + " lng=" + lastGpsLocation.getLongitude() + ")");
                    double lat = lastGpsLocation.getLatitude();
                    double lng = lastGpsLocation.getLongitude();
                    float acc = lastGpsLocation.getAccuracy();
                    lastSentLocation = lastGpsLocation;
                    lastSentTimeMs   = System.currentTimeMillis();
                    httpExecutor.execute(() -> sendToSupabase(lat, lng, acc));
                } else {
                    Log.d(TAG, "Heartbeat — no GPS fix yet, skipping");
                }
                heartbeatHandler.postDelayed(this, heartbeatStillMs);
            }
        };
        heartbeatHandler.postDelayed(heartbeatRunnable, heartbeatStillMs);
    }

    /**
     * Stop the periodic heartbeat timer.
     */
    private void stopHeartbeat() {
        if (heartbeatHandler != null && heartbeatRunnable != null) {
            heartbeatHandler.removeCallbacks(heartbeatRunnable);
        }
    }

    private void onNewLocation(Location location) {
        lastGpsLocation = location;

        if (!shouldSend(location)) return;

        lastSentLocation = location;
        lastSentTimeMs   = System.currentTimeMillis();

        double lat = location.getLatitude();
        double lng = location.getLongitude();
        float  acc = location.getAccuracy();

        Log.d(TAG, "Sending lat=" + lat + " lng=" + lng + " acc=" + acc + "m activity=" + activityName(currentActivityType));

        httpExecutor.execute(() -> sendToSupabase(lat, lng, acc));
    }

    /**
     * Adaptive send logic:
     * - MOVING: send every 30s OR when moved >distanceMeters
     * - STATIONARY: heartbeat every 3 min (keep-alive for admin tracker)
     */
    private boolean shouldSend(Location newLocation) {
        if (lastSentLocation == null || lastSentTimeMs == 0) return true;

        long elapsedMs = System.currentTimeMillis() - lastSentTimeMs;

        // Heartbeat interval based on activity
        long heartbeatMs = isStill() ? HEARTBEAT_STILL_MS : HEARTBEAT_MOVING_MS;

        // Minimum send interval (hard floor)
        if (elapsedMs < MIN_SEND_INTERVAL_MS) {
            return false;
        }

        float distanceMoved = lastSentLocation.distanceTo(newLocation);

        // Distance filter based on activity
        float distanceFilter;
        if (isStill()) {
            distanceFilter = distanceMeters * 6; // 300m — only on significant movement
        } else {
            distanceFilter = distanceMeters;     // 50m
        }

        if (distanceMoved >= distanceFilter) {
            Log.d(TAG, "Send by DISTANCE (" + Math.round(distanceMoved) + "m), filter=" + Math.round(distanceFilter) + "m");
            return true;
        }

        if (elapsedMs >= heartbeatMs) {
            Log.d(TAG, "Send by HEARTBEAT (" + (elapsedMs / 1000) + "s), activity=" + activityName(currentActivityType));
            return true;
        }

        return false;
    }

    private boolean isStill() {
        return currentActivityType == DetectedActivity.STILL
            || currentActivityType == DetectedActivity.UNKNOWN;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HTTP — Supabase REST API
    // ─────────────────────────────────────────────────────────────────────────

    private void sendToSupabase(double lat, double lng, float accuracy) {
        if (userId == null || supabaseUrl == null || supabaseKey == null) {
            Log.w(TAG, "Missing config, skipping HTTP call");
            return;
        }

        String endpoint = supabaseUrl.replaceAll("/$", "") + "/rest/v1/users?id=eq." + userId;
        String now      = java.time.Instant.now().toString();

        String body = "{"
                + "\"latitude\":"          + lat          + ","
                + "\"longitude\":"         + lng          + ","
                + "\"tracker_accuracy\":"  + accuracy     + ","
                + "\"tracker_heartbeat_at\":\"" + now      + "\","
                + "\"tracked_at\":\""      + now          + "\""
                + "}";

        try {
            URL url = new URL(endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("PATCH");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("apikey", supabaseKey);
            conn.setRequestProperty("Authorization", "Bearer " + supabaseKey);
            conn.setRequestProperty("Prefer", "return=minimal");
            conn.setConnectTimeout(10_000);
            conn.setReadTimeout(10_000);
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.getBytes(StandardCharsets.UTF_8));
            }

            int responseCode = conn.getResponseCode();
            if (responseCode >= 200 && responseCode < 300) {
                Log.i(TAG, "Sent — HTTP " + responseCode + " activity=" + activityName(currentActivityType));
            } else {
                Log.w(TAG, "Supabase HTTP " + responseCode);
            }
            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "Error sending to Supabase", e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopActivityRecognition();
        if (fusedClient != null && locationCallback != null) {
            fusedClient.removeLocationUpdates(locationCallback);
        }
        if (httpExecutor != null) {
            httpExecutor.shutdownNow();
        }
        Log.i(TAG, "Service destroyed");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private String activityName(int type) {
        switch (type) {
            case DetectedActivity.IN_VEHICLE: return "IN_VEHICLE";
            case DetectedActivity.ON_BICYCLE: return "ON_BICYCLE";
            case DetectedActivity.ON_FOOT:    return "ON_FOOT";
            case DetectedActivity.RUNNING:    return "RUNNING";
            case DetectedActivity.WALKING:    return "WALKING";
            case DetectedActivity.STILL:      return "STILL";
            case DetectedActivity.TILTING:    return "TILTING";
            default:                          return "UNKNOWN";
        }
    }
}
