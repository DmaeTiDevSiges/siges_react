package com.ag.siges;

import com.getcapacitor.BridgeActivity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.content.pm.PackageManager;
import android.Manifest;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(LocationServicePlugin.class);
        super.onCreate(savedInstanceState);

        // Create notification channels early — required for foreground services
        createNotificationChannels();

        // Iniciar serviço de notificação ao forçar fechamento
        startService(new Intent(this, TaskRemovedService.class));

        // Solicitar permissão de notificação no Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1001);
            }
        }
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);

            // Channel for LocationForegroundService
            NotificationChannel locationChannel = new NotificationChannel(
                    "siges_location_channel",
                    "Rastreamento de Localização",
                    NotificationManager.IMPORTANCE_LOW
            );
            locationChannel.setDescription("Notificação ativa durante o rastreamento de localização em segundo plano");
            manager.createNotificationChannel(locationChannel);

            // Channel for system alerts (visits, availability)
            NotificationChannel alertsChannel = new NotificationChannel(
                    "siges_alerts",
                    "Alertas do Sistema",
                    NotificationManager.IMPORTANCE_HIGH
            );
            alertsChannel.setDescription("Alertas de visitas, disponibilidade e outros eventos do sistema");
            manager.createNotificationChannel(alertsChannel);
        }
    }
}
