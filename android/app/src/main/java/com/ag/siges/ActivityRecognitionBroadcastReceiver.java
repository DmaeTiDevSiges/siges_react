package com.ag.siges;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.google.android.gms.location.ActivityRecognitionResult;
import com.google.android.gms.location.DetectedActivity;

import java.util.List;

/**
 * Receives Activity Recognition updates from Google Play Services.
 * 
 * Activity detection helps LocationForegroundService decide GPS priority:
 *   - IN_VEHICLE / ON_BICYCLE → MOVING → HIGH_ACCURACY GPS
 *   - ON_FOOT / RUNNING / WALKING → SLOW → BALANCED GPS
 *   - STILL → STATIONARY → low-power GPS
 *   - TILTING → SLOW (transitional)
 */
public class ActivityRecognitionBroadcastReceiver extends BroadcastReceiver {

    private static final String TAG = "ActivityRecognition";

    // Activity type constants (same as DetectedActivity)
    public static final int IN_VEHICLE = DetectedActivity.IN_VEHICLE;
    public static final int ON_BICYCLE = DetectedActivity.ON_BICYCLE;
    public static final int ON_FOOT    = DetectedActivity.ON_FOOT;
    public static final int RUNNING    = DetectedActivity.RUNNING;
    public static final int WALKING    = DetectedActivity.WALKING;
    public static final int STILL      = DetectedActivity.STILL;
    public static final int TILTING    = DetectedActivity.TILTING;
    public static final int UNKNOWN    = DetectedActivity.UNKNOWN;

    // Intent action for forwarding to the service
    public static final String ACTION_ACTIVITY_DETECTED = "com.ag.siges.ACTIVITY_DETECTED";
    public static final String EXTRA_ACTIVITY_TYPE = "activityType";
    public static final String EXTRA_CONFIDENCE  = "confidence";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!ActivityRecognitionResult.hasResult(intent)) {
            return;
        }

        ActivityRecognitionResult result = ActivityRecognitionResult.extractResult(intent);
        if (result == null) return;

        DetectedActivity mostProbable = result.getMostProbableActivity();
        int activityType = mostProbable.getType();
        int confidence   = mostProbable.getConfidence();

        // Log all activities for debugging
        List<DetectedActivity> activities = result.getProbableActivities();
        StringBuilder sb = new StringBuilder("Activities: ");
        for (DetectedActivity a : activities) {
            sb.append(activityName(a.getType())).append("=").append(a.getConfidence()).append("% ");
        }
        Log.d(TAG, sb.toString());

        // Forward to LocationForegroundService
        Intent serviceIntent = new Intent(context, LocationForegroundService.class);
        serviceIntent.setAction(ACTION_ACTIVITY_DETECTED);
        serviceIntent.putExtra(EXTRA_ACTIVITY_TYPE, activityType);
        serviceIntent.putExtra(EXTRA_CONFIDENCE, confidence);
        context.startService(serviceIntent);
    }

    private String activityName(int type) {
        switch (type) {
            case IN_VEHICLE: return "IN_VEHICLE";
            case ON_BICYCLE: return "ON_BICYCLE";
            case ON_FOOT:    return "ON_FOOT";
            case RUNNING:    return "RUNNING";
            case WALKING:    return "WALKING";
            case STILL:      return "STILL";
            case TILTING:    return "TILTING";
            default:         return "UNKNOWN";
        }
    }
}
