package com.piskunov.ispoved;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.core.app.NotificationCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import androidx.media.app.NotificationCompat.MediaStyle;

public class MediaNotificationService extends Service {

    public static final String ACTION_PLAY    = "com.piskunov.ispoved.ACTION_PLAY";
    public static final String ACTION_PAUSE   = "com.piskunov.ispoved.ACTION_PAUSE";
    public static final String ACTION_STOP    = "com.piskunov.ispoved.ACTION_STOP";
    // Sent from notification buttons back to the service
    static final String ACTION_BTN_PLAY  = "com.piskunov.ispoved.BTN_PLAY";
    static final String ACTION_BTN_PAUSE = "com.piskunov.ispoved.BTN_PAUSE";
    static final String ACTION_BTN_STOP  = "com.piskunov.ispoved.BTN_STOP";
    // LocalBroadcast to notify the plugin
    public static final String BROADCAST_ACTION     = "com.piskunov.ispoved.MEDIA_ACTION";
    public static final String EXTRA_MEDIA_ACTION   = "media_action";

    private static final String CHANNEL_ID    = "ispoved_media_channel";
    private static final int    NOTIFICATION_ID = 7001;

    private MediaSessionCompat mediaSession;
    private String  currentTitle = "Отрывок из Писания";
    private boolean isPlaying    = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        mediaSession = new MediaSessionCompat(this, "IspovMediaSession");
        mediaSession.setActive(true);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;
        String action = intent.getAction() != null ? intent.getAction() : "";

        switch (action) {
            case ACTION_PLAY:
                String title = intent.getStringExtra("title");
                if (title != null && !title.isEmpty()) currentTitle = title;
                isPlaying = true;
                updateMediaSession();
                startForeground(NOTIFICATION_ID, buildNotification());
                break;

            case ACTION_PAUSE:
                isPlaying = false;
                updateMediaSession();
                refreshNotification();
                break;

            case ACTION_STOP:
                isPlaying = false;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE);
                } else {
                    stopForeground(true);
                }
                stopSelf();
                break;

            // Notification button: play
            case ACTION_BTN_PLAY:
                isPlaying = true;
                updateMediaSession();
                refreshNotification();
                sendLocalBroadcast("play");
                break;

            // Notification button: pause
            case ACTION_BTN_PAUSE:
                isPlaying = false;
                updateMediaSession();
                refreshNotification();
                sendLocalBroadcast("pause");
                break;

            // Notification button: stop
            case ACTION_BTN_STOP:
                isPlaying = false;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE);
                } else {
                    stopForeground(true);
                }
                stopSelf();
                sendLocalBroadcast("stop");
                break;
        }

        return START_NOT_STICKY;
    }

    private void sendLocalBroadcast(String action) {
        Intent broadcast = new Intent(BROADCAST_ACTION);
        broadcast.putExtra(EXTRA_MEDIA_ACTION, action);
        LocalBroadcastManager.getInstance(this).sendBroadcast(broadcast);
    }

    private void updateMediaSession() {
        int state = isPlaying
            ? PlaybackStateCompat.STATE_PLAYING
            : PlaybackStateCompat.STATE_PAUSED;
        PlaybackStateCompat pbState = new PlaybackStateCompat.Builder()
            .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f)
            .setActions(PlaybackStateCompat.ACTION_PLAY_PAUSE | PlaybackStateCompat.ACTION_STOP)
            .build();
        mediaSession.setPlaybackState(pbState);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Воспроизведение отрывка",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setShowBadge(false);
            channel.setSound(null, null);
            NotificationManager mgr = getSystemService(NotificationManager.class);
            if (mgr != null) mgr.createNotificationChannel(channel);
        }
    }

    private PendingIntent btnIntent(String action, int requestCode) {
        Intent intent = new Intent(this, MediaNotificationService.class);
        intent.setAction(action);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getService(this, requestCode, intent, flags);
    }

    private Notification buildNotification() {
        // Play/Pause action button
        String btnAction   = isPlaying ? ACTION_BTN_PAUSE : ACTION_BTN_PLAY;
        int    btnIcon     = isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play;
        String btnLabel    = isPlaying ? "Пауза" : "Воспроизвести";
        NotificationCompat.Action playPauseAction = new NotificationCompat.Action(
            btnIcon, btnLabel, btnIntent(btnAction, 1));

        // Stop action button
        NotificationCompat.Action stopAction = new NotificationCompat.Action(
            android.R.drawable.ic_menu_close_clear_cancel,
            "Стоп",
            btnIntent(ACTION_BTN_STOP, 2));

        // Open app on notification tap
        Intent openApp = new Intent(this, MainActivity.class);
        openApp.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openAppPI = PendingIntent.getActivity(
            this, 0, openApp,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(currentTitle)
            .setContentText("Исповедь — Отрывок из Писания")
            .setSmallIcon(android.R.drawable.ic_lock_silent_mode_off)
            .setContentIntent(openAppPI)
            .addAction(playPauseAction)
            .addAction(stopAction)
            .setStyle(new MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1))
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setSilent(true)
            .setOngoing(isPlaying)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void refreshNotification() {
        NotificationManager mgr = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (mgr != null) mgr.notify(NOTIFICATION_ID, buildNotification());
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
