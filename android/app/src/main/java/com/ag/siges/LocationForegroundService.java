package com.ag.siges;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * LocationForegroundService
 *
 * Serviço nativo Android que roda com alta prioridade (Foreground Service),
 * independente da WebView / Javascript.
 *
 * Funciona mesmo com o app minimizado ou completamente fechado.
 * Envia a localização diretamente para a API REST do Supabase via HTTP.
 *
 * Iniciado via Intent pela MainActivity/Javascript através do
 * LocationServicePlugin (Capacitor plugin bridge).
 */
public class LocationForegroundService extends Service {

    private static final String TAG = "LocationFGService";
    private static final String CHANNEL_ID = "siges_location_channel";
    private static final int NOTIFICATION_ID = 1001;

    // Intent actions para controle externo
    public static final String ACTION_START = "com.ag.siges.START_TRACKING";
    public static final String ACTION_STOP  = "com.ag.siges.STOP_TRACKING";

    // Intent extras
    public static final String EXTRA_USER_ID      = "userId";
    public static final String EXTRA_SUPABASE_URL = "supabaseUrl";
    public static final String EXTRA_SUPABASE_KEY = "supabaseKey";
    public static final String EXTRA_INTERVAL_SEC = "intervalSeconds";
    public static final String EXTRA_DISTANCE_M   = "distanceMeters";

    private FusedLocationProviderClient fusedClient;
    private LocationCallback locationCallback;
    private ExecutorService httpExecutor;

    // Configurações recebidas do JS
    private String userId;
    private String supabaseUrl;
    private String supabaseKey;
    private int intervalSeconds  = 60;
    private float distanceMeters = 50f;
    private boolean hasOpenVisit = false;

    // Throttle por distância e tempo
    private static final long MIN_SEND_INTERVAL_MS = 60_000; // 60 segundos
    private Location lastSentLocation = null;
    private long     lastSentTimeMs   = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        httpExecutor = Executors.newSingleThreadExecutor();
        fusedClient  = LocationServices.getFusedLocationProviderClient(this);
        createNotificationChannel();
        Log.i(TAG, "Service created");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || ACTION_STOP.equals(intent.getAction())) {
            Log.i(TAG, "STOP action received");
            stopSelf();
            return START_NOT_STICKY;
        }

        // Lê configurações do Intent
        userId        = intent.getStringExtra(EXTRA_USER_ID);
        supabaseUrl   = intent.getStringExtra(EXTRA_SUPABASE_URL);
        supabaseKey   = intent.getStringExtra(EXTRA_SUPABASE_KEY);
        intervalSeconds  = intent.getIntExtra(EXTRA_INTERVAL_SEC, 60);
        distanceMeters   = intent.getFloatExtra(EXTRA_DISTANCE_M, 50f);
        hasOpenVisit  = intent.getBooleanExtra("hasOpenVisit", false);

        Log.i(TAG, "START — userId=" + userId + " interval=" + intervalSeconds + "s dist=" + distanceMeters + "m hasOpenVisit=" + hasOpenVisit);

        // Promove o service para Foreground (mostra a notificação persistente)
        startForegroundWithNotification();

        // Inicia o rastreamento GPS via FusedLocationProvider
        startLocationUpdates();

        // Se o SO matar o serviço (ex: baixa memória), reinicia automaticamente
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

        String title = "SIGES";
        String text = hasOpenVisit ? "Você possui uma visita em ABERTO." : "Entre para verificar demandas";

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setOngoing(true)           // Não pode ser removida pelo usuário
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setContentIntent(pendingIntent)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Rastreamento de Localização",
                    NotificationManager.IMPORTANCE_LOW // Silencioso (sem som)
            );
            channel.setDescription("Manter a localização do campo atualizada em tempo real");
            channel.setShowBadge(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GPS — FusedLocationProvider
    // ─────────────────────────────────────────────────────────────────────────

    private void startLocationUpdates() {
        // Usa distanceFilter=0 no SO para receber ticks frequentes,
        // mas o throttle real é feito em shouldSend() com distância e tempo.
        LocationRequest request = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5_000)
                .setMinUpdateIntervalMillis(2_000)
                .setMinUpdateDistanceMeters(0)
                .build();

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult result) {
                if (result == null) return;
                Location location = result.getLastLocation();
                if (location == null) return;
                onNewLocation(location);
            }
        };

        try {
            fusedClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper());
            Log.i(TAG, "Location updates requested");
        } catch (SecurityException e) {
            Log.e(TAG, "No location permission", e);
        }
    }

    private void onNewLocation(Location location) {
        if (!shouldSend(location)) return;

        lastSentLocation = location;
        lastSentTimeMs   = System.currentTimeMillis();

        double lat = location.getLatitude();
        double lng = location.getLongitude();
        float  acc = location.getAccuracy();

        Log.d(TAG, "📍 Sending → lat=" + lat + " lng=" + lng + " acc=" + acc + "m");

        // Envia para o Supabase numa thread separada (nunca bloqueia a thread do GPS)
        httpExecutor.execute(() -> sendToSupabase(lat, lng, acc));
    }

    /**
     * Decide se deve enviar a nova localização baseado em:
     * 1. Throttling temporal mínimo (MIN_SEND_INTERVAL_MS = 60s) para evitar consumo excessivo de bateria/rede
     * 2. Distância percorrida desde a última posição enviada (com limite adaptativo baseado na velocidade)
     * 3. Tempo limite total decorrido (heartbeat temporal)
     */
    private boolean shouldSend(Location newLocation) {
        if (lastSentLocation == null || lastSentTimeMs == 0) return true;

        long  elapsedMs     = System.currentTimeMillis() - lastSentTimeMs;

        // 1. Throttling Temporal: Bloqueia envios muito frequentes para economizar rádio e bateria
        if (elapsedMs < MIN_SEND_INTERVAL_MS) {
            return false;
        }

        float distanceMoved = lastSentLocation.distanceTo(newLocation);
        long  elapsedSec    = elapsedMs / 1000;

        // 2. Filtro Adaptativo por Velocidade
        float currentDistanceFilter = distanceMeters;
        if (newLocation.hasSpeed()) {
            float speedMps = newLocation.getSpeed(); // metros por segundo
            float speedKmh = speedMps * 3.6f;        // converte para km/h
            
            if (speedKmh > 50f) {
                currentDistanceFilter = distanceMeters * 5; // ex: 250m se base for 50m
            } else if (speedKmh > 20f) {
                currentDistanceFilter = distanceMeters * 3; // ex: 150m se base for 50m
            }
        }

        if (distanceMoved >= currentDistanceFilter) {
            Log.d(TAG, "✅ Send triggered by DISTANCE (" + Math.round(distanceMoved) + "m), adaptive threshold: " + Math.round(currentDistanceFilter) + "m");
            return true;
        }
        if (elapsedSec >= intervalSeconds) {
            Log.d(TAG, "✅ Send triggered by TIME (" + elapsedSec + "s)");
            return true;
        }

        return false;
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
        String now      = java.time.Instant.now().toString(); // ISO 8601

        String body = "{"
                + "\"latitude\":"                  + lat                        + ","
                + "\"longitude\":"                 + lng                        + ","
                + "\"tracker_accuracy\":"          + accuracy                   + ","
                + "\"tracker_heartbeat_at\":\"" + now                        + "\","
                + "\"tracked_at\":\""              + now                        + "\""
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
                Log.i(TAG, "✅ Location sent to Supabase — HTTP " + responseCode);
            } else {
                Log.w(TAG, "⚠ Supabase returned HTTP " + responseCode);
            }
            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "❌ Error sending to Supabase", e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public void onDestroy() {
        super.onDestroy();
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
        return null; // Não usamos binding
    }
}
