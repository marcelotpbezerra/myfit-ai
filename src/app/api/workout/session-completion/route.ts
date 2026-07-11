import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { exercises, workoutLogs, workoutSessions } from "@/db/schema";

const exerciseSummarySchema = z.object({
  exerciseId: z.number().int().positive(),
  exerciseName: z.string().min(1),
  muscleGroup: z.string().nullable().optional(),
  split: z.string().nullable().optional(),
  completedSets: z.number().int().nonnegative(),
  targetSets: z.number().int().nonnegative(),
  targetReps: z.number().int().nonnegative().nullable().optional(),
  targetWeight: z.string().nullable().optional(),
  weight: z.string().optional(),
  reps: z.number().int().nonnegative().optional(),
  startedAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const completionSchema = z.object({
  localId: z.string().min(1),
  split: z.string().min(1),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  totalExercises: z.number().int().nonnegative(),
  completedExercises: z.number().int().nonnegative(),
  totalSets: z.number().int().nonnegative(),
  exercises: z.array(exerciseSummarySchema).default([]),
  notes: z.string().optional(),
  source: z.enum(["phone", "watch", "manual"]).default("phone"),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: z.infer<typeof completionSchema>;
  try {
    payload = completionSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  try {
    const startedAt = new Date(payload.startedAt);
    const completedAt = new Date(payload.completedAt);

    const sessionLogs = await db
      .select({
        exerciseName: exercises.name,
        muscleGroup: exercises.muscleGroup,
        split: exercises.split,
        weight: workoutLogs.weight,
        reps: workoutLogs.reps,
        notes: workoutLogs.notes,
        startedAt: workoutLogs.startedAt,
        completedAt: workoutLogs.completedAt,
      })
      .from(workoutLogs)
      .innerJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
      .where(
        and(
          eq(workoutLogs.userId, userId),
          sql`COALESCE(${workoutLogs.completedAt}, ${workoutLogs.createdAt}) >= ${startedAt}`,
          sql`COALESCE(${workoutLogs.completedAt}, ${workoutLogs.createdAt}) <= ${completedAt}`,
        )
      )
      .orderBy(desc(workoutLogs.createdAt));

    const exerciseSummary = new Map<string, { sets: number; volume: number }>();
    let totalVolume = 0;

    for (const log of sessionLogs) {
      const volume = Number(log.weight ?? 0) * Number(log.reps ?? 0);
      totalVolume += volume;

      const current = exerciseSummary.get(log.exerciseName) ?? { sets: 0, volume: 0 };
      current.sets += 1;
      current.volume += volume;
      exerciseSummary.set(log.exerciseName, current);
    }

    const storedSession = {
      userId,
      localId: payload.localId,
      split: payload.split,
      totalExercises: payload.totalExercises,
      completedExercises: payload.completedExercises,
      totalSets: sessionLogs.length || payload.totalSets,
      totalVolume: totalVolume.toString(),
      exercises: Array.from(exerciseSummary.entries()).map(([exerciseName, stats]) => ({
        exerciseName,
        sets: stats.sets,
        volume: stats.volume,
      })),
      notes: payload.notes,
      source: payload.source,
      startedAt,
      completedAt,
    };

    await db.insert(workoutSessions).values(storedSession).onConflictDoNothing();

    // Sem isto, o dashboard inicial (/dashboard) continuava servindo o RSC
    // cacheado de antes do treino — router.refresh() no client só revalida a
    // rota atualmente montada (/dashboard/workout), não outras rotas.
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/workout");

    let forwardedToStack = false;
    const webhookUrl = process.env.STACK_PERFORMANCE_WEBHOOK_URL?.trim();

    if (webhookUrl) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        const webhookKey = process.env.STACK_PERFORMANCE_WEBHOOK_KEY?.trim() || process.env.INTERNAL_API_KEY?.trim();
        if (webhookKey) {
          headers["x-api-key"] = webhookKey;
        }

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...storedSession,
            exerciseLogs: sessionLogs,
          }),
        });

        forwardedToStack = response.ok;
      } catch (error) {
        console.error("[session-completion] Erro ao encaminhar para a stack:", error);
      }
    }

    return NextResponse.json({
      success: true,
      forwardedToStack,
      session: {
        localId: payload.localId,
        split: payload.split,
        totalSets: storedSession.totalSets,
        totalVolume: Math.round(totalVolume),
      },
    });
  } catch (error) {
    console.error("[session-completion] Erro ao registrar sessão:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
