package com.myfit.ai.wear

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.health.services.client.ExerciseUpdateCallback
import androidx.health.services.client.HealthServices
import androidx.health.services.client.data.Availability
import androidx.health.services.client.data.DataType
import androidx.health.services.client.data.ExerciseConfig
import androidx.health.services.client.data.ExerciseLapSummary
import androidx.health.services.client.data.ExerciseType
import androidx.health.services.client.data.ExerciseUpdate

/**
 * Sessão de exercício de primeiro plano: mantém a leitura de FC ativa quando a
 * tela apaga ou o usuário navega para fora. As amostras não são persistidas nem
 * enviadas ao telefone; só o valor atual é exibido no relógio.
 */
class WearExerciseService : Service() {
    private val exerciseClient by lazy { HealthServices.getClient(this).exerciseClient }
    private var sessionStarted = false

    private val updateCallback = object : ExerciseUpdateCallback {
        override fun onRegistered() = Unit

        override fun onRegistrationFailed(throwable: Throwable) {
            reportError("FC indisponível")
        }

        override fun onExerciseUpdateReceived(update: ExerciseUpdate) {
            update.latestMetrics.getData(DataType.HEART_RATE_BPM).lastOrNull()?.let { point ->
                sendBroadcast(Intent(ACTION_HEART_RATE).setPackage(packageName).putExtra(EXTRA_BPM, point.value))
            }
        }

        override fun onLapSummaryReceived(lapSummary: ExerciseLapSummary) = Unit
        override fun onAvailabilityChanged(dataType: DataType<*, *>, availability: Availability) = Unit
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            endSession()
            return START_NOT_STICKY
        }
        startForeground(NOTIFICATION_ID, buildNotification())
        if (!sessionStarted) startSession()
        return START_NOT_STICKY
    }

    private fun startSession() {
        val capabilitiesFuture = exerciseClient.getCapabilitiesAsync()
        capabilitiesFuture.addListener({
            try {
                val supported = capabilitiesFuture.get()
                    .getExerciseTypeCapabilities(ExerciseType.WORKOUT)
                    .supportedDataTypes
                if (!supported.contains(DataType.HEART_RATE_BPM)) {
                    reportError("FC não suportada neste relógio")
                    stopSelf()
                    return@addListener
                }
                exerciseClient.setUpdateCallback(mainExecutor, updateCallback)
                val config = ExerciseConfig.Builder(ExerciseType.WORKOUT)
                    .setDataTypes(setOf(DataType.HEART_RATE_BPM))
                    .setIsGpsEnabled(false)
                    .setIsAutoPauseAndResumeEnabled(false)
                    .build()
                exerciseClient.startExerciseAsync(config).addListener({ sessionStarted = true }, mainExecutor)
            } catch (_: Exception) {
                reportError("Não foi possível iniciar FC")
                stopSelf()
            }
        }, mainExecutor)
    }

    private fun endSession() {
        if (sessionStarted) exerciseClient.endExerciseAsync()
        exerciseClient.clearUpdateCallbackAsync(updateCallback)
        sessionStarted = false
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun reportError(message: String) {
        sendBroadcast(Intent(ACTION_HEART_RATE).setPackage(packageName).putExtra(EXTRA_ERROR, message))
    }

    private fun buildNotification() = NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.ic_media_play)
        .setContentTitle("MyFit em treino")
        .setContentText("Frequência cardíaca ativa")
        .setOngoing(true)
        .setContentIntent(PendingIntent.getActivity(this, 0, Intent(this, WearWorkoutActivity::class.java), PendingIntent.FLAG_IMMUTABLE))
        .build()

    override fun onCreate() {
        super.onCreate()
        val channel = NotificationChannel(CHANNEL_ID, "Treino MyFit", NotificationManager.IMPORTANCE_LOW)
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    override fun onDestroy() {
        if (sessionStarted) exerciseClient.endExerciseAsync()
        exerciseClient.clearUpdateCallbackAsync(updateCallback)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val ACTION_START = "com.myfit.ai.wear.START_EXERCISE"
        const val ACTION_STOP = "com.myfit.ai.wear.STOP_EXERCISE"
        const val ACTION_HEART_RATE = "com.myfit.ai.wear.HEART_RATE"
        const val EXTRA_BPM = "bpm"
        const val EXTRA_ERROR = "error"
        private const val CHANNEL_ID = "workout_heart_rate"
        private const val NOTIFICATION_ID = 4101
    }
}
