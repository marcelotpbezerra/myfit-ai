package com.myfit.ai.wear

import android.Manifest
import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.wearable.Wearable
import org.json.JSONObject
import java.nio.charset.StandardCharsets

class WearWorkoutActivity : Activity() {
    private lateinit var workout: TextView
    private lateinit var countdown: TextView
    private lateinit var heartRate: TextView
    private var state = WorkoutState()
    private val clockHandler = Handler(Looper.getMainLooper())
    private val clockTicker = object : Runnable {
        override fun run() {
            renderCountdown()
            clockHandler.postDelayed(this, 1_000)
        }
    }

    private val stateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            intent.getStringExtra(WearDataListenerService.EXTRA_STATE)?.let(::applyState)
        }
    }

    private val heartRateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when {
                intent.hasExtra(WearExerciseService.EXTRA_BPM) -> {
                    heartRate.text = "FC ${intent.getDoubleExtra(WearExerciseService.EXTRA_BPM, 0.0).toInt()} bpm"
                }
                intent.hasExtra(WearExerciseService.EXTRA_ERROR) -> {
                    heartRate.text = intent.getStringExtra(WearExerciseService.EXTRA_ERROR)
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(buildScreen())
        registerReceiver(stateReceiver, IntentFilter(WearDataListenerService.ACTION_STATE_CHANGED), RECEIVER_NOT_EXPORTED)
        registerReceiver(heartRateReceiver, IntentFilter(WearExerciseService.ACTION_HEART_RATE), RECEIVER_NOT_EXPORTED)
        requestHeartRatePermissionIfNeeded()
    }

    override fun onResume() {
        super.onResume()
        if (state.workoutSessionId.isNotBlank()) startExerciseIfPermitted()
        clockHandler.post(clockTicker)
    }

    override fun onPause() {
        clockHandler.removeCallbacks(clockTicker)
        super.onPause()
    }

    override fun onDestroy() {
        unregisterReceiver(stateReceiver)
        unregisterReceiver(heartRateReceiver)
        super.onDestroy()
    }

    private fun buildScreen(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        setPadding(16, 16, 16, 16)
        workout = label("Aguardando treino", 18f)
        countdown = label("--:--", 42f)
        heartRate = label("FC indisponível", 18f)
        addView(workout); addView(countdown); addView(heartRate)
        addView(button("✓ Série feita") { sendCommand(WearContracts.ACTION_SET_COMPLETED) })
        addView(button("−10 s") { sendCommand(WearContracts.ACTION_REST_ADJUSTED, -10) })
        addView(button("+30 s") { sendCommand(WearContracts.ACTION_REST_ADJUSTED, 30) })
        addView(button("Concluir descanso") { sendCommand(WearContracts.ACTION_REST_COMPLETED) })
        addView(button("Encerrar FC") { stopService(Intent(this@WearWorkoutActivity, WearExerciseService::class.java).setAction(WearExerciseService.ACTION_STOP)) })
    }

    private fun label(text: String, size: Float) = TextView(this).apply {
        this.text = text; textSize = size; gravity = Gravity.CENTER
    }

    private fun button(text: String, action: () -> Unit) = Button(this).apply {
        this.text = text; setOnClickListener { action() }
    }

    private fun applyState(payload: String) {
        val json = JSONObject(payload)
        state = WorkoutState(
            workoutSessionId = json.optString("workoutSessionId"),
            exerciseName = json.optString("exerciseName", "Treino ativo"),
            setNumber = json.optInt("setNumber"),
            totalSets = json.optInt("totalSets"),
            restEndsAtEpochMs = json.optLong("restEndsAtEpochMs"),
        )
        workout.text = "${state.exerciseName} • ${state.setNumber}/${state.totalSets}"
        renderCountdown()
        startExerciseIfPermitted()
    }

    /** Cronômetro local: não depende da latência do Data Layer ou do telefone. */
    private fun renderCountdown() {
        val remaining = (state.restEndsAtEpochMs - System.currentTimeMillis()).coerceAtLeast(0) / 1000
        countdown.text = "%d:%02d".format(remaining / 60, remaining % 60)
    }

    private fun sendCommand(action: String, deltaSeconds: Int? = null) {
        val payload = JSONObject().apply {
            put("commandId", "wear-${SystemClock.elapsedRealtime()}")
            put("action", action)
            put("workoutSessionId", state.workoutSessionId)
            deltaSeconds?.let { put("deltaSeconds", it) }
        }.toString().toByteArray(StandardCharsets.UTF_8)
        Wearable.getNodeClient(this).connectedNodes.addOnSuccessListener { nodes ->
            nodes.forEach { node -> Wearable.getMessageClient(this).sendMessage(node.id, WearContracts.COMMAND_PATH, payload) }
        }
    }

    private fun requestHeartRatePermissionIfNeeded() {
        val permission = if (Build.VERSION.SDK_INT >= 36) "android.permission.health.READ_HEART_RATE" else Manifest.permission.BODY_SENSORS
        if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(permission), REQUEST_HEART_RATE)
        }
    }

    private fun startExerciseIfPermitted() {
        val permission = if (Build.VERSION.SDK_INT >= 36) "android.permission.health.READ_HEART_RATE" else Manifest.permission.BODY_SENSORS
        if (ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED) {
            ContextCompat.startForegroundService(this, Intent(this, WearExerciseService::class.java).setAction(WearExerciseService.ACTION_START))
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_HEART_RATE && grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) startExerciseIfPermitted()
    }

    companion object { private const val REQUEST_HEART_RATE = 901 }
}
