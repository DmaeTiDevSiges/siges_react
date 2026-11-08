package com.ag.siges;

import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Calendar;
import java.util.TimeZone;
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
    public static final String EXTRA_TRACKER_TOKEN = "trackerToken";
    /** Reinício pelo sistema/boot: restaura a config salva em SharedPreferences. */
    public static final String ACTION_RESTORE = "com.ag.siges.RESTORE_TRACKING";

    // Config persistida (sobrevive ao Android encerrar o processo e ao reboot).
    static final String PREFS = "siges_tracker";
    static final String PREF_ENABLED  = "enabled";
    static final String PREF_USER_ID  = "userId";
    static final String PREF_URL      = "supabaseUrl";
    static final String PREF_KEY      = "supabaseKey";
    static final String PREF_TOKEN    = "trackerToken";
    static final String PREF_INTERVAL = "intervalSeconds";
    static final String PREF_DISTANCE = "distanceMeters";
    static final String PREF_CONFIG   = "trackerConfig";
    /** JSON de cfg_app.tracker_config (intervalos por atividade). Opcional. */
    public static final String EXTRA_TRACKER_CONFIG = "trackerConfig";
    // Expediente do usuário (users.shift_start/shift_end, "HH:mm[:ss]") e se há visita aberta
    // (visita aberta ignora o expediente: rastreia a qualquer hora).
    static final String PREF_SHIFT_START  = "shiftStart";
    static final String PREF_SHIFT_END    = "shiftEnd";
    static final String PREF_IGNORE_SHIFT = "ignoreShift";
    public static final String EXTRA_SHIFT_START  = "shiftStart";
    public static final String EXTRA_SHIFT_END    = "shiftEnd";
    public static final String EXTRA_IGNORE_SHIFT = "ignoreShift";
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
    private String trackerToken;
    private float distanceMeters = 50f;
    private boolean running = false;

    // ── Activity Recognition state ──
    // Confidence threshold to act on detected activity
    private static final int CONFIDENCE_THRESHOLD = 50;

    // Current activity
    private int currentActivityType = DetectedActivity.UNKNOWN;
    private int currentConfidence   = 0;

    // Intervalos de leitura/envio por atividade (cfg_app.tracker_config; padrões em TrackerConfig).
    private TrackerConfig config = TrackerConfig.defaults();

    // ── Expediente ──
    private static final long SHIFT_CHECK_MS = 60_000;
    private static final TimeZone TZ_BR = TimeZone.getTimeZone("America/Sao_Paulo");
    private int shiftStartMin = -1;   // minutos do dia; -1 = sem expediente definido
    private int shiftEndMin   = -1;
    private boolean ignoreShift = false;
    /** true = fora do expediente e sem visita: GPS, atividade e envios desligados. */
    private boolean paused = false;
    private Runnable shiftCheckRunnable;

    private Location lastSentLocation = null;
    private long     lastSentTimeMs   = 0;
    private Location lastGpsLocation  = null;

    // ── Heartbeat timer (keeps tracker_heartbeat_at fresh when GPS is off) ──
    private Handler  heartbeatHandler;
    private Runnable heartbeatRunnable;
    private long     heartbeatStillMs = TrackerConfig.defaults().still.sendMaxIntervalMs;

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
        String action = intent != null ? intent.getAction() : ACTION_RESTORE;

        if (ACTION_STOP.equals(action)) {
            Log.i(TAG, "STOP action received");
            disableAndStop();
            return START_NOT_STICKY;
        }

        // Resultado do Activity Recognition. Se o processo tinha morrido, o
        // receiver pode acordar o serviço por aqui: restaura antes de usar.
        if (ACTION_ACTIVITY_DETECTED.equals(action)) {
            if (!running && !restoreAndStart()) return START_NOT_STICKY;
            int activityType = intent.getIntExtra(EXTRA_ACTIVITY_TYPE, DetectedActivity.UNKNOWN);
            int confidence   = intent.getIntExtra(EXTRA_CONFIDENCE, 0);
            onActivityDetected(activityType, confidence);
            return START_STICKY;
        }

        // intent == null → o Android recriou o serviço (START_STICKY) após
        // encerrar o processo. ACTION_RESTORE → boot / atualização do app.
        if (ACTION_RESTORE.equals(action)) {
            return restoreAndStart() ? START_STICKY : START_NOT_STICKY;
        }

        // START vindo do JS: grava a config e inicia.
        SharedPreferences.Editor editor = prefs().edit()
                .putBoolean(PREF_ENABLED, true)
                .putString(PREF_USER_ID, intent.getStringExtra(EXTRA_USER_ID))
                .putString(PREF_URL, intent.getStringExtra(EXTRA_SUPABASE_URL))
                .putString(PREF_KEY, intent.getStringExtra(EXTRA_SUPABASE_KEY))
                .putString(PREF_TOKEN, intent.getStringExtra(EXTRA_TRACKER_TOKEN))
                .putInt(PREF_INTERVAL, intent.getIntExtra(EXTRA_INTERVAL_SEC, 60))
                .putFloat(PREF_DISTANCE, intent.getFloatExtra(EXTRA_DISTANCE_M, 50f))
                // null (JS antigo) remove a chave → padrões do APK.
                .putString(PREF_CONFIG, intent.getStringExtra(EXTRA_TRACKER_CONFIG))
                .putString(PREF_SHIFT_START, intent.getStringExtra(EXTRA_SHIFT_START))
                .putString(PREF_SHIFT_END, intent.getStringExtra(EXTRA_SHIFT_END))
                .putBoolean(PREF_IGNORE_SHIFT, intent.getBooleanExtra(EXTRA_IGNORE_SHIFT, false));
        editor.apply();

        return restoreAndStart() ? START_STICKY : START_NOT_STICKY;
    }

    private SharedPreferences prefs() {
        return getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Carrega a config salva e (re)inicia o rastreamento. false = nada a restaurar. */
    private boolean restoreAndStart() {
        SharedPreferences p = prefs();
        if (!p.getBoolean(PREF_ENABLED, false)) {
            Log.i(TAG, "Restore skipped — tracking disabled");
            // startForegroundService exige startForeground antes de parar.
            startForegroundWithNotification();
            stopSelf();
            return false;
        }

        userId       = p.getString(PREF_USER_ID, null);
        supabaseUrl  = p.getString(PREF_URL, null);
        supabaseKey  = p.getString(PREF_KEY, null);
        trackerToken = p.getString(PREF_TOKEN, null);
        distanceMeters = p.getFloat(PREF_DISTANCE, 50f);
        long intervalSec = p.getInt(PREF_INTERVAL, 60);
        config = TrackerConfig.parse(p.getString(PREF_CONFIG, null));
        shiftStartMin = parseClock(p.getString(PREF_SHIFT_START, null));
        shiftEndMin   = parseClock(p.getString(PREF_SHIFT_END, null));
        ignoreShift   = p.getBoolean(PREF_IGNORE_SHIFT, false);
        // Heartbeat parado: o maior entre a config global e o intervalo do usuário
        // (antes usava só o do usuário — em geral 60 s — e o celular parado enviava a cada minuto).
        heartbeatStillMs = Math.max(config.still.sendMaxIntervalMs, Math.max(intervalSec * 1000L, config.minSendIntervalMs));

        startForegroundWithNotification();

        if (userId == null || supabaseUrl == null || supabaseKey == null || trackerToken == null) {
            Log.w(TAG, "Restore failed — incomplete config");
            disableAndStop();
            return false;
        }

        Log.i(TAG, "START — userId=" + userId + " heartbeatStill=" + (heartbeatStillMs / 1000) + "s shift="
                + shiftStartMin + "-" + shiftEndMin + "min ignoreShift=" + ignoreShift + " config: " + config);

        if (!running) {
            startActivityRecognition();
            startLocationUpdates();
            running = true;
        } else {
            // Já rodando (novo START do JS): reaplica intervalos da config atualizada.
            adaptGpsForActivity(currentActivityType);
        }
        evaluateShift();
        scheduleShiftCheck();
        return true;
    }

    /** Desliga de vez (não volta sozinho) e apaga o token salvo. */
    private void disableAndStop() {
        prefs().edit()
                .putBoolean(PREF_ENABLED, false)
                .remove(PREF_TOKEN)
                .apply();
        stopSelf();
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
                .setContentText(paused
                        ? "Localização pausada fora do expediente"
                        : "Localização compartilhada enquanto você estiver disponível ou em visita")
                .setStyle(new NotificationCompat.BigTextStyle().bigText(paused
                        ? "Localização pausada fora do seu expediente. Volta sozinha no início do turno "
                          + "ou se você abrir uma visita."
                        : "Localização compartilhada com a sua empresa enquanto você estiver disponível ou em visita. "
                          + "Fica indisponível no app para pausar."))
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
     * This is the core battery optimization (intervalos em cfg_app.tracker_config):
     *   - STILL: LOW_POWER (antenas + Wi-Fi; padrão 5 min) + heartbeat backup
     *   - ON_FOOT e demais: balanced GPS (padrão 30 s)
     *   - IN_VEHICLE: balanced GPS (padrão 15 s, lote de 60 s; alta precisão opcional)
     */
    private void adaptGpsForActivity(int activityType) {
        if (paused) return; // fora do expediente: nada de GPS
        TrackerConfig.Mode m;
        switch (activityType) {
            case DetectedActivity.STILL:
            case DetectedActivity.UNKNOWN:
                // Parado: antenas + Wi-Fi (precisão ~100-500 m, bateria mínima) + heartbeat de reserva.
                stopHeartbeat();
                m = config.still;
                requestLocationWithPriority(Priority.PRIORITY_LOW_POWER, m.gpsIntervalMs, m.gpsMinIntervalMs, m.batchMs);
                startHeartbeat();
                Log.i(TAG, "GPS LOW_POWER — STILL " + m);
                break;

            case DetectedActivity.IN_VEHICLE:
            case DetectedActivity.ON_BICYCLE:
                // Veículo: balanceado por padrão (alta precisão só se high_accuracy=true), com lote.
                stopHeartbeat();
                m = config.vehicle;
                requestLocationWithPriority(
                        m.highAccuracy ? Priority.PRIORITY_HIGH_ACCURACY : Priority.PRIORITY_BALANCED_POWER_ACCURACY,
                        m.gpsIntervalMs, m.gpsMinIntervalMs, m.batchMs);
                Log.i(TAG, "GPS VEHICLE " + m);
                break;

            default:
                // A pé, correndo, inclinando (transição) e demais: modo "a pé".
                stopHeartbeat();
                m = config.foot;
                requestLocationWithPriority(Priority.PRIORITY_BALANCED_POWER_ACCURACY, m.gpsIntervalMs, m.gpsMinIntervalMs, m.batchMs);
                Log.i(TAG, "GPS BALANCED — " + activityName(activityType) + " " + m);
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

    private void requestLocationWithPriority(int priority, long intervalMs, long minIntervalMs, long batchMs) {
        if (fusedClient == null || locationCallback == null) return;

        LocationRequest.Builder builder = new LocationRequest.Builder(priority, intervalMs)
                .setMinUpdateIntervalMillis(minIntervalMs)
                .setMinUpdateDistanceMeters(0);
        // Lote: o provedor junta posições e entrega de uma vez (menos despertares).
        // Só tem efeito quando maior que o intervalo; usamos a última posição do lote.
        if (batchMs > intervalMs) builder.setMaxUpdateDelayMillis(batchMs);
        LocationRequest request = builder.build();

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
        if (paused) return;
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
     * Decide se envia a posição ao servidor (valores de cfg_app.tracker_config):
     * - nunca antes de min_send_interval_s desde o último envio;
     * - envia ao andar send_distance_m do modo atual;
     * - ou quando passar send_max_interval_s do modo atual (heartbeat).
     */
    private boolean shouldSend(Location newLocation) {
        if (lastSentLocation == null || lastSentTimeMs == 0) return true;

        long elapsedMs = System.currentTimeMillis() - lastSentTimeMs;
        if (elapsedMs < config.minSendIntervalMs) return false;

        TrackerConfig.Mode m = currentMode();
        float distanceMoved = lastSentLocation.distanceTo(newLocation);
        if (distanceMoved >= m.sendDistanceM) {
            Log.d(TAG, "Send by DISTANCE (" + Math.round(distanceMoved) + "m), filter=" + Math.round(m.sendDistanceM) + "m");
            return true;
        }

        if (elapsedMs >= m.sendMaxIntervalMs) {
            Log.d(TAG, "Send by HEARTBEAT (" + (elapsedMs / 1000) + "s), activity=" + activityName(currentActivityType));
            return true;
        }

        return false;
    }

    private TrackerConfig.Mode currentMode() {
        if (isStill()) return config.still;
        if (currentActivityType == DetectedActivity.IN_VEHICLE || currentActivityType == DetectedActivity.ON_BICYCLE) {
            return config.vehicle;
        }
        return config.foot;
    }

    private boolean isStill() {
        return currentActivityType == DetectedActivity.STILL
            || currentActivityType == DetectedActivity.UNKNOWN;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HTTP — Supabase REST API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Envia a posição para public.fn_tracker_report_location (SECURITY DEFINER).
     * A chave anon só autentica o gateway; quem autoriza é o token do aparelho,
     * e a função só altera a localização do dono do token. Horário é definido
     * no banco (America/Sao_Paulo).
     */
    private void sendToSupabase(double lat, double lng, float accuracy) {
        if (supabaseUrl == null || supabaseKey == null || trackerToken == null) {
            Log.w(TAG, "Missing config, skipping HTTP call");
            return;
        }

        String endpoint = supabaseUrl.replaceAll("/$", "") + "/rest/v1/rpc/fn_tracker_report_location";
        String body = "{"
                + "\"p_token\":\""   + trackerToken + "\","
                + "\"p_latitude\":"  + lat + ","
                + "\"p_longitude\":" + lng + ","
                + "\"p_accuracy\":"  + accuracy
                + "}";

        HttpURLConnection conn = null;
        try {
            URL url = new URL(endpoint);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("apikey", supabaseKey);
            conn.setRequestProperty("Authorization", "Bearer " + supabaseKey);
            conn.setConnectTimeout(10_000);
            conn.setReadTimeout(10_000);
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.getBytes(StandardCharsets.UTF_8));
            }

            int responseCode = conn.getResponseCode();
            if (responseCode < 200 || responseCode >= 300) {
                Log.w(TAG, "Supabase HTTP " + responseCode);
                return;
            }

            String result = readBody(conn.getInputStream()).replace("\"", "").trim();
            Log.i(TAG, "Sent — " + result + " activity=" + activityName(currentActivityType));

            // 'paused': usuário indisponível e sem visita (regra no banco).
            // 'invalid': token revogado/inexistente. Em ambos, desliga o serviço;
            // o app religa ao abrir quando o usuário voltar a ficar disponível.
            if ("paused".equals(result) || "invalid".equals(result)) {
                heartbeatHandler.post(this::disableAndStop);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending to Supabase", e);
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static String readBody(InputStream in) throws java.io.IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null && sb.length() < 200) sb.append(line);
        }
        return sb.toString();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    // ─────────────────────────────────────────────────────────────────────────
    // Expediente — pausa fora do turno (sem visita aberta), retoma sozinho
    // ─────────────────────────────────────────────────────────────────────────

    private static int parseClock(String value) {
        return TrackerConfig.parseClock(value);
    }

    /** Dia ISO (1 = segunda ... 7 = domingo) a partir de Calendar.DAY_OF_WEEK. */
    private static int isoDay(Calendar c) {
        return ((c.get(Calendar.DAY_OF_WEEK) + 5) % 7) + 1;
    }

    /**
     * Deve rastrear agora? Visita aberta ou regra desligada → sempre.
     * Janela fixa da config (window_start/window_end) tem prioridade sobre o turno do usuário;
     * sem nenhuma das duas → sempre.
     */
    private boolean shouldTrackNow() {
        if (ignoreShift || !config.shiftOnly) return true;
        boolean useWindow = config.windowStartMin >= 0 && config.windowEndMin >= 0;
        int startMin = useWindow ? config.windowStartMin : shiftStartMin;
        int endMin   = useWindow ? config.windowEndMin   : shiftEndMin;
        if (startMin < 0 || endMin < 0) return true;

        Calendar c = Calendar.getInstance(TZ_BR);
        int now = c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE);
        int today = isoDay(c);
        int yesterday = today == 1 ? 7 : today - 1;
        int start = startMin - config.shiftMarginMin;
        int end   = endMin + config.shiftMarginMin;

        if (startMin <= endMin) {
            // Turno no mesmo dia (ex.: 08:00–18:00).
            return config.shiftDays[today] && now >= start && now <= end;
        }
        // Turno que vira a noite (ex.: 22:00–06:00): parte de hoje ou continuação do turno de ontem.
        return (config.shiftDays[today] && now >= start) || (config.shiftDays[yesterday] && now <= end);
    }

    /** Aplica pausa/retomada conforme o expediente. */
    private void evaluateShift() {
        boolean track = shouldTrackNow();
        if (!track && !paused) {
            paused = true;
            stopHeartbeat();
            removeLocationUpdates();
            stopActivityRecognition();
            startForegroundWithNotification(); // atualiza o texto: "pausada"
            Log.i(TAG, "PAUSED — fora do expediente (sem visita aberta)");
        } else if (track && paused) {
            paused = false;
            startActivityRecognition();
            adaptGpsForActivity(currentActivityType);
            startForegroundWithNotification();
            Log.i(TAG, "RESUMED — dentro do expediente ou visita aberta");
        }
    }

    private void scheduleShiftCheck() {
        if (shiftCheckRunnable != null) heartbeatHandler.removeCallbacks(shiftCheckRunnable);
        shiftCheckRunnable = new Runnable() {
            @Override
            public void run() {
                evaluateShift();
                heartbeatHandler.postDelayed(this, SHIFT_CHECK_MS);
            }
        };
        heartbeatHandler.postDelayed(shiftCheckRunnable, SHIFT_CHECK_MS);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        running = false;
        if (shiftCheckRunnable != null) heartbeatHandler.removeCallbacks(shiftCheckRunnable);
        stopHeartbeat();
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
