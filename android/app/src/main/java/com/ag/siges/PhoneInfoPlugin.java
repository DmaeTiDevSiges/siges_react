package com.ag.siges;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.telephony.TelephonyManager;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.List;

@CapacitorPlugin(
    name = "PhoneInfo",
    permissions = {
        @Permission(
            strings = {
                Manifest.permission.READ_PHONE_STATE,
                "android.permission.READ_PHONE_NUMBERS"
            },
            alias = "phoneState"
        )
    }
)
public class PhoneInfoPlugin extends Plugin {

    private static final String TAG = "PhoneInfoPlugin";
    private static final int REQUEST_CODE = 5555;
    private PluginCall savedCall;

    @PluginMethod
    public void getPhoneNumber(PluginCall call) {
        savedCall = call;

        String permNeeded;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            permNeeded = "android.permission.READ_PHONE_NUMBERS";
        } else {
            permNeeded = Manifest.permission.READ_PHONE_STATE;
        }

        Log.d(TAG, "getPhoneNumber called. SDK=" + Build.VERSION.SDK_INT + " checking perm=" + permNeeded);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int check = ContextCompat.checkSelfPermission(getContext(), permNeeded);
            Log.d(TAG, "checkSelfPermission result=" + check + " GRANTED=" + PackageManager.PERMISSION_GRANTED);

            if (check != PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Permission not granted, requesting via Capacitor...");
                requestPermissionForAlias("phoneState", call, "handlePhonePermission");
                return;
            }
        }

        Log.d(TAG, "Permission already granted, resolving number...");
        resolveWithPhoneNumber(call);
    }

    @PermissionCallback
    private void handlePhonePermission(PluginCall call) {
        String permState = String.valueOf(getPermissionState("phoneState"));
        Log.d(TAG, "handlePhonePermission callback. state=" + permState);

        if (getPermissionState("phoneState") != null &&
            getPermissionState("phoneState").toString().equals("granted")) {
            resolveWithPhoneNumber(call);
        } else {
            // Try direct request as fallback
            Log.d(TAG, "Capacitor perm denied, trying direct request...");
            String permNeeded;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                permNeeded = "android.permission.READ_PHONE_NUMBERS";
            } else {
                permNeeded = Manifest.permission.READ_PHONE_STATE;
            }

            ActivityCompat.requestPermissions(
                getActivity(),
                new String[]{ permNeeded, Manifest.permission.READ_PHONE_STATE },
                REQUEST_CODE
            );
            // Resolve with denied message — user must accept from Settings
            JSObject ret = new JSObject();
            ret.put("number", null);
            ret.put("error", "Permissão negada. Conceda em Configurações > Apps > SIGES > Permissões");
            call.resolve(ret);
        }
    }

    private void resolveWithPhoneNumber(PluginCall call) {
        try {
            TelephonyManager tm = (TelephonyManager) getContext().getSystemService(Context.TELEPHONY_SERVICE);

            String phoneNumber = null;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                String permNeeded;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    permNeeded = "android.permission.READ_PHONE_NUMBERS";
                } else {
                    permNeeded = Manifest.permission.READ_PHONE_STATE;
                }

                if (ContextCompat.checkSelfPermission(getContext(), permNeeded)
                        == PackageManager.PERMISSION_GRANTED) {

                    // Try getLine1Number()
                    phoneNumber = tm.getLine1Number();
                    Log.d(TAG, "getLine1Number() returned: " + phoneNumber);

                    // If null, try SubscriptionManager for dual SIM devices
                    if ((phoneNumber == null || phoneNumber.isEmpty())
                            && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                        SubscriptionManager sm = (SubscriptionManager) getContext()
                                .getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
                        if (ContextCompat.checkSelfPermission(getContext(), permNeeded)
                                == PackageManager.PERMISSION_GRANTED) {
                            List<SubscriptionInfo> subs = sm.getActiveSubscriptionInfoList();
                            if (subs != null && !subs.isEmpty()) {
                                SubscriptionInfo first = subs.get(0);
                                phoneNumber = first.getNumber();
                                Log.d(TAG, "SubscriptionManager number: " + phoneNumber);
                            }
                        }
                    }
                } else {
                    Log.w(TAG, "Permission still not granted after request");
                }
            } else {
                phoneNumber = tm.getLine1Number();
            }

            JSObject ret = new JSObject();
            if (phoneNumber != null && !phoneNumber.isEmpty()) {
                ret.put("number", phoneNumber);
                ret.put("error", null);
            } else {
                ret.put("number", null);
                ret.put("error", "Número não disponível no chip/SIM");
            }
            Log.d(TAG, "Final result: number=" + phoneNumber + " error=" + ret.get("error"));
            call.resolve(ret);

        } catch (SecurityException e) {
            Log.e(TAG, "SecurityException: " + e.getMessage(), e);
            JSObject ret = new JSObject();
            ret.put("number", null);
            ret.put("error", "SecurityException: " + e.getMessage());
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Unexpected error", e);
            call.reject("Erro ao obter número", e);
        }
    }
}
