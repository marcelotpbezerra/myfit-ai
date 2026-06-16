export type WorkoutSessionSource = "phone" | "watch" | "manual";

export interface WorkoutSessionExerciseSummary {
  exerciseId: number;
  exerciseName: string;
  muscleGroup?: string | null;
  split?: string | null;
  completedSets: number;
  targetSets: number;
  targetReps?: number | null;
  targetWeight?: string | null;
  weight?: string;
  reps?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
}

export interface WorkoutSessionCompletionPayload {
  localId: string;
  split: string;
  startedAt: string;
  completedAt: string;
  totalExercises: number;
  completedExercises: number;
  totalSets: number;
  exercises: WorkoutSessionExerciseSummary[];
  notes?: string;
  source?: WorkoutSessionSource;
}

export async function submitWorkoutSessionCompletion(
  payload: WorkoutSessionCompletionPayload
): Promise<{ success: boolean; forwardedToStack?: boolean; error?: string }> {
  const response = await fetch("/api/workout/session-completion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      success: false,
      error: data?.error || "Falha ao registrar sessão de treino",
    };
  }

  return {
    success: true,
    forwardedToStack: Boolean(data?.forwardedToStack),
  };
}
