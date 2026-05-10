export type RestStatus = "idle" | "resting" | "paused" | "completed" | "skipped";

export interface RestContext {
  workoutId?: string;
  exerciseId: number;
  exerciseName?: string;
  setIndex: number;
  totalSets?: number;
  targetWeight?: string | null;
  targetReps?: number | null;
  source?: "phone" | "watch" | "notification";
}

export interface RestSession extends RestContext {
  id: string;
  status: RestStatus;
  plannedRestSeconds: number;
  startedAt: string;
  pausedAt?: string;
  completedAt?: string;
  actualRestSeconds: number;
  remainingSeconds: number;
}

const clampSeconds = (value: number) => Math.max(0, Math.round(value));

export function createRestSession(
  context: RestContext,
  plannedRestSeconds: number,
  startedAt: Date = new Date(),
): RestSession {
  const planned = clampSeconds(plannedRestSeconds || 60);
  return {
    ...context,
    id: `rest-${context.exerciseId}-${context.setIndex}-${startedAt.getTime()}`,
    status: "resting",
    plannedRestSeconds: planned,
    startedAt: startedAt.toISOString(),
    actualRestSeconds: 0,
    remainingSeconds: planned,
    source: context.source ?? "phone",
  };
}

export function getElapsedRestSeconds(session: RestSession, at: Date = new Date()) {
  const end = session.completedAt ? new Date(session.completedAt) : at;
  return clampSeconds((end.getTime() - new Date(session.startedAt).getTime()) / 1000);
}

export function tickRestSession(session: RestSession, at: Date = new Date()): RestSession {
  if (session.status !== "resting") return session;

  const actualRestSeconds = getElapsedRestSeconds(session, at);
  return {
    ...session,
    actualRestSeconds,
    remainingSeconds: clampSeconds(session.plannedRestSeconds - actualRestSeconds),
  };
}

export function adjustRestSession(session: RestSession, deltaSeconds: number): RestSession {
  const plannedRestSeconds = clampSeconds(session.plannedRestSeconds + deltaSeconds);
  const updated = tickRestSession({ ...session, plannedRestSeconds });
  return {
    ...updated,
    remainingSeconds: clampSeconds(plannedRestSeconds - updated.actualRestSeconds),
  };
}

export function completeRestSession(
  session: RestSession,
  status: Extract<RestStatus, "completed" | "skipped"> = "completed",
  at: Date = new Date(),
): RestSession {
  const completedAt = at.toISOString();
  const actualRestSeconds = getElapsedRestSeconds({ ...session, completedAt }, at);

  return {
    ...session,
    status,
    completedAt,
    actualRestSeconds,
    remainingSeconds: 0,
  };
}

export function serializeRestForLog(session: RestSession) {
  return {
    workoutId: session.workoutId,
    exerciseId: session.exerciseId,
    setIndex: session.setIndex,
    restStartedAt: session.startedAt,
    plannedRestSeconds: session.plannedRestSeconds,
    actualRestSeconds: session.actualRestSeconds,
    source: session.source ?? "phone",
    status: session.status,
  };
}
