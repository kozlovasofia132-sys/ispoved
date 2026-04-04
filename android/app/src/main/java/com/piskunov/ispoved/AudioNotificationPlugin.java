package com.piskunov.ispoved;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioNotification")
public class AudioNotificationPlugin extends Plugin {

    private BroadcastReceiver mediaActionReceiver;

    @Override
    public void load() {
        mediaActionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getStringExtra(MediaNotificationService.EXTRA_MEDIA_ACTION);
                JSObject data = new JSObject();
                data.put("action", action != null ? action : "");
                notifyListeners("mediaAction", data);
            }
        };
        LocalBroadcastManager.getInstance(getContext()).registerReceiver(
            mediaActionReceiver,
            new IntentFilter(MediaNotificationService.BROADCAST_ACTION)
        );
    }

    /** Show or update the media notification. title and isPlaying are required. */
    @PluginMethod
    public void show(PluginCall call) {
        String  title     = call.getString("title", "Отрывок из Писания");
        Boolean isPlaying = call.getBoolean("isPlaying", true);

        Intent intent = new Intent(getContext(), MediaNotificationService.class);
        intent.setAction(isPlaying
            ? MediaNotificationService.ACTION_PLAY
            : MediaNotificationService.ACTION_PAUSE);
        intent.putExtra("title", title);
        startService(intent);
        call.resolve();
    }

    /** Update only the play/pause state without changing the title. */
    @PluginMethod
    public void updatePlayState(PluginCall call) {
        Boolean isPlaying = call.getBoolean("isPlaying", false);

        Intent intent = new Intent(getContext(), MediaNotificationService.class);
        intent.setAction(isPlaying
            ? MediaNotificationService.ACTION_PLAY
            : MediaNotificationService.ACTION_PAUSE);
        startService(intent);
        call.resolve();
    }

    /** Dismiss the notification and stop the foreground service. */
    @PluginMethod
    public void hide(PluginCall call) {
        Intent intent = new Intent(getContext(), MediaNotificationService.class);
        intent.setAction(MediaNotificationService.ACTION_STOP);
        getContext().startService(intent);
        call.resolve();
    }

    private void startService(Intent intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (mediaActionReceiver != null) {
            LocalBroadcastManager.getInstance(getContext())
                .unregisterReceiver(mediaActionReceiver);
        }
    }
}
