import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workoutLogs, exercises } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const apiKey = req.headers.get("x-api-key");
    const internalKey = process.env.INTERNAL_API_KEY;

    if (!apiKey || apiKey !== internalKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Data local BRT (UTC-3)
        const nowBRT = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const today = nowBRT.toISOString().split('T')[0];

        const logs = await db
            .select({
                weight: workoutLogs.weight,
                reps: workoutLogs.reps,
                split: exercises.split,
                exerciseName: exercises.name,
                muscleGroup: exercises.muscleGroup,
                createdAt: workoutLogs.createdAt
            })
            .from(workoutLogs)
            .innerJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
            .where(
                sql`DATE(${workoutLogs.createdAt}) = ${today}`
            );

        if (!logs || logs.length === 0) {
            return NextResponse.json({
                trainedToday: false,
                message: "Nenhum treino registrado hoje."
            });
        }

        const totalVolume = logs.reduce((acc, l) => {
            return acc + (Number(l.weight ?? 0) * (l.reps ?? 0));
        }, 0);

        // Agrupar por exercício
        const exerciseSummary: Record<string, { sets: number, volume: number }> = {};
        logs.forEach(l => {
            if (!exerciseSummary[l.exerciseName]) {
                exerciseSummary[l.exerciseName] = { sets: 0, volume: 0 };
            }
            exerciseSummary[l.exerciseName].sets += 1;
            exerciseSummary[l.exerciseName].volume += (Number(l.weight ?? 0) * (l.reps ?? 0));
        });

        // Split mais frequente
        const splitCount: Record<string, number> = {};
        logs.forEach(l => {
            const s = l.split ?? "A";
            splitCount[s] = (splitCount[s] ?? 0) + 1;
        });
        const splitTrained = Object.entries(splitCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "A";

        return NextResponse.json({
            trainedToday: true,
            date: today,
            split: splitTrained,
            totalSets: logs.length,
            totalVolume: Math.round(totalVolume),
            exercises: exerciseSummary,
            raw: logs
        });

    } catch (error) {
        console.error("[API Workout Summary] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
