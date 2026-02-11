"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { exercises, workoutLogs, userSettings } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const MOCK_BASE_EXERCISES = [
    { name: "Supino Reto", muscleGroup: "Peito", split: "A" },
    { name: "Supino Inclinado", muscleGroup: "Peito", split: "A" },
    { name: "Crucifixo", muscleGroup: "Peito", split: "A" },
    { name: "Desenvolvimento Halteres", muscleGroup: "Ombros", split: "A" },
    { name: "Elevação Lateral", muscleGroup: "Ombros", split: "A" },
    { name: "Tríceps Pulley", muscleGroup: "Tríceps", split: "A" },
    { name: "Tríceps Corda", muscleGroup: "Tríceps", split: "A" },

    { name: "Puxada Aberta", muscleGroup: "Costas", split: "B" },
    { name: "Remada Baixa", muscleGroup: "Costas", split: "B" },
    { name: "Serrote", muscleGroup: "Costas", split: "B" },
    { name: "Rosca Direta", muscleGroup: "Bíceps", split: "B" },
    { name: "Rosca Martelo", muscleGroup: "Bíceps", split: "B" },
    { name: "Encolhimento", muscleGroup: "Trapézio", split: "B" },

    { name: "Agachamento Livre", muscleGroup: "Pernas", split: "C" },
    { name: "Leg Press 45", muscleGroup: "Pernas", split: "C" },
    { name: "Extensora", muscleGroup: "Pernas", split: "C" },
    { name: "Flexora", muscleGroup: "Pernas", split: "C" },
    { name: "Panturrilha em pé", muscleGroup: "Pernas", split: "C" },
];

export async function getUserSettings() {
    const { userId } = await auth();
    if (!userId) return null;

    const settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
    });

    if (!settings) {
        // Inicializa com padrão se não existir
        const newSettings = { userId, workoutSplit: "ABC", restTimeDefault: 60 };
        await db.insert(userSettings).values(newSettings);
        return newSettings;
    }

    return settings;
}

export async function updateWorkoutSplit(split: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.insert(userSettings)
        .values({ userId, workoutSplit: split })
        .onConflictDoUpdate({
            target: userSettings.userId,
            set: { workoutSplit: split, updatedAt: new Date() },
        });

    revalidatePath("/dashboard/workout");
}

export async function getExercisesBySplit(split: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    return await db.query.exercises.findMany({
        where: and(
            eq(exercises.userId, userId),
            eq(exercises.split, split)
        ),
    });
}

export async function getAllExercises() {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    return await db.query.exercises.findMany({
        where: eq(exercises.userId, userId),
    });
}

export async function logSet(data: {
    exerciseId: number;
    weight: string;
    reps: number;
    restTime: number;
    notes?: string;
    startedAt?: Date;
    completedAt?: Date;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.insert(workoutLogs).values({
        userId,
        exerciseId: data.exerciseId,
        weight: data.weight,
        reps: data.reps,
        restTime: data.restTime,
        notes: data.notes,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
    });

    revalidatePath("/dashboard/workout");
}

export async function addExerciseToWorkout(data: {
    name: string;
    muscleGroup: string;
    split: string;
    targetSets?: number;
    targetReps?: number;
    targetWeight?: string;
    targetRestTime?: number;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.insert(exercises).values({
        userId,
        name: data.name,
        muscleGroup: data.muscleGroup,
        split: data.split,
        isCustom: true,
        targetSets: data.targetSets || 3,
        targetReps: data.targetReps || 12,
        targetWeight: data.targetWeight || "0",
        targetRestTime: data.targetRestTime || 60,
    }).onConflictDoUpdate({
        target: [exercises.userId, exercises.name],
        set: {
            split: data.split,
            targetSets: data.targetSets || 3,
            targetReps: data.targetReps || 12,
            targetWeight: data.targetWeight || "0",
            targetRestTime: data.targetRestTime || 60,
        },
    });

    revalidatePath("/dashboard/workout");
    return { success: true };
}

export async function updateTargetWeight(exerciseId: number, weight: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.update(exercises)
        .set({ targetWeight: weight, updatedAt: new Date() })
        .where(and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)));

    revalidatePath("/dashboard/workout");
    return { success: true };
}

export async function importBaseExercises() {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    const { EXERCISES_DB } = await import("@/lib/exercises-db");

    // Para fins de importação inicial, vamos distribuir entre ABC
    const exercisesToInsert = EXERCISES_DB.map((ex, index) => {
        let split = "A";
        if (index % 3 === 1) split = "B";
        if (index % 3 === 2) split = "C";

        return {
            ...ex,
            userId,
            split,
            isCustom: false,
            targetSets: 3,
            targetReps: 12,
            targetWeight: "0",
            targetRestTime: 60,
        };
    });

    await db.insert(exercises)
        .values(exercisesToInsert)
        .onConflictDoNothing();

    revalidatePath("/dashboard/workout");
    return { success: true };
}

export async function deleteExercise(id: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.delete(exercises).where(and(
        eq(exercises.id, id),
        eq(exercises.userId, userId)
    ));

    revalidatePath("/dashboard/workout");
    return { success: true };
}

export async function getRecentLogs(exerciseId: number) {
    const { userId } = await auth();
    if (!userId) return [];

    return await db.query.workoutLogs.findMany({
        where: and(
            eq(workoutLogs.userId, userId),
            eq(workoutLogs.exerciseId, exerciseId)
        ),
        orderBy: [desc(workoutLogs.createdAt)],
        limit: 5,
    });
}
