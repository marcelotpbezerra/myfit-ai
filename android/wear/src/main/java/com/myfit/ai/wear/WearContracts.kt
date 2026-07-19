package com.myfit.ai.wear

object WearContracts {
    const val COMMAND_PATH = "/myfit/command/v1"
    const val STATE_PATH = "/myfit/workout-state/v1"
    const val ACTION_SET_COMPLETED = "set_completed"
    const val ACTION_REST_ADJUSTED = "rest_adjusted"
    const val ACTION_REST_COMPLETED = "rest_completed"
}

data class WorkoutState(
    val workoutSessionId: String = "",
    val exerciseName: String = "Aguardando treino",
    val setNumber: Int = 0,
    val totalSets: Int = 0,
    val restEndsAtEpochMs: Long = 0L,
)
