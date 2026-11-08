package com.ag.siges;

import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Intervalos do rastreamento, por atividade detectada. Vêm de cfg_app.tracker_config
 * (JSON repassado pelo JS no start e salvo em SharedPreferences). Chave ausente ou
 * JSON inválido → valores padrão abaixo (recomendação de economia de bateria).
 *
 * Ver dev/supabase/migrations/20261116_add_cfg_app_tracker_config.sql.
 */
final class TrackerConfig {

    private static final String TAG = "TrackerConfig";

    /** Configuração de um modo (parado / a pé / veículo). */
    static final class Mode {
        final long    gpsIntervalMs;
        final long    gpsMinIntervalMs;
        final float   sendDistanceM;
        final long    sendMaxIntervalMs;
        final long    batchMs;
        final boolean highAccuracy;

        Mode(long gpsIntervalMs, long gpsMinIntervalMs, float sendDistanceM,
             long sendMaxIntervalMs, long batchMs, boolean highAccuracy) {
            this.gpsIntervalMs     = gpsIntervalMs;
            this.gpsMinIntervalMs  = gpsMinIntervalMs;
            this.sendDistanceM     = sendDistanceM;
            this.sendMaxIntervalMs = sendMaxIntervalMs;
            this.batchMs           = batchMs;
            this.highAccuracy      = highAccuracy;
        }

        @Override
        public String toString() {
            return "gps=" + gpsIntervalMs / 1000 + "s dist=" + Math.round(sendDistanceM) + "m max=" + sendMaxIntervalMs / 1000
                    + "s batch=" + batchMs / 1000 + "s hi=" + highAccuracy;
        }
    }

    // Padrões (nov/2026): parado 5 min; a pé 30 s/100 m/3 min; veículo 15 s/300 m/2 min, lote 60 s.
    private static final Mode DEFAULT_STILL   = new Mode(300_000, 120_000, 300f, 300_000, 0,      false);
    private static final Mode DEFAULT_FOOT    = new Mode(30_000,  15_000,  100f, 180_000, 0,      false);
    private static final Mode DEFAULT_VEHICLE = new Mode(15_000,  10_000,  300f, 120_000, 60_000, false);
    private static final long DEFAULT_MIN_SEND_MS = 60_000;

    // Limites de segurança contra valores absurdos vindos do banco.
    private static final long MIN_GPS_MS  = 5_000;
    private static final long MIN_SEND_MS = 15_000;

    // Expediente: fora do turno do usuário (users.shift_start/shift_end) e sem visita
    // aberta, o rastreamento pausa. Dias ISO: 1 = segunda ... 7 = domingo.
    private static final boolean DEFAULT_SHIFT_ONLY = true;
    private static final int     DEFAULT_SHIFT_MARGIN_MIN = 30;

    final long minSendIntervalMs;
    final Mode still;
    final Mode foot;
    final Mode vehicle;
    final boolean shiftOnly;
    /** shiftDays[1..7] (ISO); índice 0 não usado. */
    final boolean[] shiftDays;
    final int shiftMarginMin;
    /**
     * Janela fixa para todos (minutos do dia), ex.: 07:00–19:00. Quando definida,
     * substitui o turno individual (users.shift_start/shift_end). -1 = não definida.
     */
    final int windowStartMin;
    final int windowEndMin;

    private TrackerConfig(long minSendIntervalMs, Mode still, Mode foot, Mode vehicle,
                          boolean shiftOnly, boolean[] shiftDays, int shiftMarginMin,
                          int windowStartMin, int windowEndMin) {
        this.minSendIntervalMs = minSendIntervalMs;
        this.still   = still;
        this.foot    = foot;
        this.vehicle = vehicle;
        this.shiftOnly = shiftOnly;
        this.shiftDays = shiftDays;
        this.shiftMarginMin = shiftMarginMin;
        this.windowStartMin = windowStartMin;
        this.windowEndMin = windowEndMin;
    }

    /** "07:00" / "07:00:00" → minutos do dia; inválido → -1. */
    static int parseClock(String value) {
        if (value == null) return -1;
        try {
            String[] parts = value.trim().split(":");
            int h = Integer.parseInt(parts[0]);
            int m = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
            return (h >= 0 && h < 24 && m >= 0 && m < 60) ? h * 60 + m : -1;
        } catch (Exception e) {
            return -1;
        }
    }

    private static boolean[] allDays() {
        boolean[] d = new boolean[8];
        for (int i = 1; i <= 7; i++) d[i] = true;
        return d;
    }

    static TrackerConfig defaults() {
        return new TrackerConfig(DEFAULT_MIN_SEND_MS, DEFAULT_STILL, DEFAULT_FOOT, DEFAULT_VEHICLE,
                DEFAULT_SHIFT_ONLY, allDays(), DEFAULT_SHIFT_MARGIN_MIN, -1, -1);
    }

    /** Lê o JSON de cfg_app.tracker_config; qualquer problema cai nos padrões. */
    static TrackerConfig parse(String json) {
        if (json == null || json.trim().isEmpty()) return defaults();
        try {
            JSONObject o = new JSONObject(json);
            long minSend = Math.max(MIN_SEND_MS, seconds(o, "min_send_interval_s", DEFAULT_MIN_SEND_MS));
            boolean[] days = allDays();
            JSONArray arr = o.optJSONArray("shift_days");
            if (arr != null && arr.length() > 0) {
                days = new boolean[8];
                for (int i = 0; i < arr.length(); i++) {
                    int d = arr.optInt(i, 0);
                    if (d >= 1 && d <= 7) days[d] = true;
                }
            }
            int margin = Math.max(0, Math.min(240, o.optInt("shift_margin_min", DEFAULT_SHIFT_MARGIN_MIN)));
            return new TrackerConfig(
                    minSend,
                    mode(o.optJSONObject("still"),   DEFAULT_STILL),
                    mode(o.optJSONObject("foot"),    DEFAULT_FOOT),
                    mode(o.optJSONObject("vehicle"), DEFAULT_VEHICLE),
                    o.optBoolean("shift_only", DEFAULT_SHIFT_ONLY),
                    days,
                    margin,
                    parseClock(o.optString("window_start", null)),
                    parseClock(o.optString("window_end", null)));
        } catch (Exception e) {
            Log.w(TAG, "tracker_config inválido, usando padrões: " + e.getMessage());
            return defaults();
        }
    }

    private static Mode mode(JSONObject o, Mode def) {
        if (o == null) return def;
        long gps    = Math.max(MIN_GPS_MS, seconds(o, "gps_interval_s", def.gpsIntervalMs));
        long gpsMin = Math.max(MIN_GPS_MS / 2, Math.min(gps, seconds(o, "gps_min_interval_s", def.gpsMinIntervalMs)));
        float dist  = (float) Math.max(10, o.optDouble("send_distance_m", def.sendDistanceM));
        long maxInt = Math.max(MIN_SEND_MS, seconds(o, "send_max_interval_s", def.sendMaxIntervalMs));
        long batch  = Math.max(0, seconds(o, "batch_s", def.batchMs));
        boolean hi  = o.optBoolean("high_accuracy", def.highAccuracy);
        return new Mode(gps, gpsMin, dist, maxInt, batch, hi);
    }

    /** Lê um campo em segundos e devolve em ms (ou o padrão, já em ms). */
    private static long seconds(JSONObject o, String key, long defMs) {
        if (!o.has(key) || o.isNull(key)) return defMs;
        double v = o.optDouble(key, Double.NaN);
        return Double.isNaN(v) ? defMs : Math.round(v * 1000);
    }

    @Override
    public String toString() {
        StringBuilder d = new StringBuilder();
        for (int i = 1; i <= 7; i++) if (shiftDays[i]) d.append(i);
        return "minSend=" + minSendIntervalMs / 1000 + "s | still[" + still + "] | foot[" + foot + "] | vehicle[" + vehicle + "]"
                + " | shiftOnly=" + shiftOnly + " days=" + d + " margin=" + shiftMarginMin + "min"
                + " window=" + windowStartMin + "-" + windowEndMin;
    }
}
