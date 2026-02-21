"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { exercises, workoutLogs, userSettings } from "@/db/schema";
import { eq, and, desc, sql, or, isNull } from "drizzle-orm";
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

export async function getNextSuggestedWorkout() {
    const { userId } = await auth();
    if (!userId) return { letter: 'A', name: 'Treino A — Empurre' };

    try {
        // 1. Pegar configurações do usuário
        const settings = await getUserSettings();
        const splitType = settings?.workoutSplit || "ABC";

        // 2. Encontrar o último exercício registrado
        const lastLog = await db.select({
            split: exercises.split,
            completedAt: workoutLogs.completedAt
        })
            .from(workoutLogs)
            .innerJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
            .where(eq(workoutLogs.userId, userId))
            .orderBy(desc(workoutLogs.createdAt)) // Usando createdAt pois o completedAt pode ser nulo em alguns casos
            .limit(1);

        const lastSplit = lastLog[0]?.split || null;
        console.log("DEBUG: splitType =", splitType);
        console.log("DEBUG: lastSplit found =", lastSplit);

        // 3. Lógica de rotação
        const splitsArray = splitType.split(''); // ['A', 'B', 'C']
        let nextSplit = splitsArray[0];

        if (lastSplit) {
            const lastIndex = splitsArray.indexOf(lastSplit.toUpperCase());
            if (lastIndex !== -1) {
                // Se existe no array, pega o próximo ou volta pro primeiro
                const nextIndex = (lastIndex + 1) % splitsArray.length;
                nextSplit = splitsArray[nextIndex];
                console.log("DEBUG: Rotating from", lastSplit, "to", nextSplit, "(Index:", lastIndex, "->", nextIndex, ")");
            } else {
                console.log("DEBUG: lastSplit not in splitsArray, defaulting to A");
            }
        } else {
            console.log("DEBUG: No lastLog found, defaulting to A");
        }

        // 4. Buscar um nome/grupo muscular para esse split
        const exampleExercise = await db.query.exercises.findFirst({
            where: and(eq(exercises.userId, userId), eq(exercises.split, nextSplit))
        });

        // Tentar obter grupos musculares únicos para esse split
        const allExercisesInSplit = await db.query.exercises.findMany({
            where: and(eq(exercises.userId, userId), eq(exercises.split, nextSplit)),
            columns: { muscleGroup: true }
        });

        const muscleGroups = Array.from(new Set(allExercisesInSplit.map(e => e.muscleGroup).filter(Boolean)));
        const muscleString = muscleGroups.slice(0, 2).join(" & ");

        const descriptiveName = muscleString || (nextSplit === 'A' ? 'Empurre' : nextSplit === 'B' ? 'Puxe' : 'Pernas');

        return {
            letter: nextSplit,
            name: `Treino ${nextSplit} — ${descriptiveName}`
        };
    } catch (error) {
        console.error("Erro ao sugerir próximo treino:", error);
        return { letter: 'A', name: 'Treino A — Empurre' };
    }
}

export async function getWorkoutLogsByDate(dateStr: string) {
    const { userId } = await auth();
    if (!userId) return [];

    const logs = await db.select({
        log: workoutLogs,
        exercise: exercises
    })
        .from(workoutLogs)
        .innerJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
        .where(and(
            eq(workoutLogs.userId, userId),
            sql`DATE(${workoutLogs.createdAt}) = ${dateStr}`
        ))
        .orderBy(desc(workoutLogs.createdAt));

    return logs;
}

export async function addExerciseToCatalog(data: {
    name: string;
    muscleGroup: string;
    equipment: string;
    gifUrl: string;
    split?: string;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.insert(exercises)
        .values({
            userId,
            name: data.name,
            muscleGroup: data.muscleGroup,
            equipment: data.equipment,
            gifUrl: data.gifUrl,
            isCustom: false,
            split: data.split || "A", // Padrão inicial ou o selecionado
            targetSets: 3,
            targetReps: 12,
            targetRestTime: 60,
        })
        .onConflictDoUpdate({
            target: [exercises.userId, exercises.name],
            set: {
                muscleGroup: data.muscleGroup,
                equipment: data.equipment,
                gifUrl: data.gifUrl,
                updatedAt: new Date()
            }
        });

    revalidatePath("/dashboard/workout");
    return { success: true };
}

export async function getExercisesMissingTutorials() {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    const missingExercises = await db.select({
        id: exercises.id,
        name: exercises.name
    })
        .from(exercises)
        .where(and(
            eq(exercises.userId, userId),
            or(isNull(exercises.gifUrl), eq(exercises.gifUrl, ""))
        ));

    return missingExercises;
}

export async function syncExerciseTutorial(exerciseId: number, name: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    const { searchExerciseFromAPI } = await import("@/lib/exercise-api");

    console.log(`[Persistence V4] Iniciando sinc para: "${name}" (ID Local: ${exerciseId}, User: ${userId})`);

    try {
        const results = await searchExerciseFromAPI(name);
        if (results && results.length > 0) {
            const bestMatch = results[0];
            console.log(`[Persistence V4] Match encontrado: ${bestMatch.name}. GIF: ${bestMatch.gifUrl.substring(0, 30)}...`);

            const updateRes = await db.update(exercises)
                .set({
                    gifUrl: bestMatch.gifUrl,
                    muscleGroup: bestMatch.targetMuscle,
                    equipment: bestMatch.equipment,
                    updatedAt: new Date()
                })
                .where(and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)))
                .returning({ id: exercises.id });

            console.log(`[Persistence V4] Resultado Update:`, updateRes.length > 0 ? `Sucesso (ID: ${updateRes[0].id})` : "FALHA - Nenhuma linha afetada");

            revalidatePath("/dashboard/workout");
            return { success: true, gifUrl: bestMatch.gifUrl };
        }
        console.warn(`[Persistence V4] Nenhum resultado para "${name}"`);
        return { success: false, error: "Nenhum tutorial encontrado" };
    } catch (error) {
        console.error("[Persistence V4] Erro crítico:", error);
        return { success: false, error: "Falha na busca" };
    }
}

export async function syncAllMissingTutorials() {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    console.log(`[Persistence V4] Sincronização em Lote Iniciada (User: ${userId})`);

    const missingExercises = await db.query.exercises.findMany({
        where: and(
            eq(exercises.userId, userId),
            or(isNull(exercises.gifUrl), eq(exercises.gifUrl, ""))
        )
    });

    console.log(`[Persistence V4] Exercícios sem tutorial: ${missingExercises.length}`);

    if (missingExercises.length === 0) return { success: true, count: 0 };

    const { searchExerciseFromAPI } = await import("@/lib/exercise-api");
    let syncedCount = 0;

    for (const ex of missingExercises) {
        try {
            console.log(`[Persistence V4] Processando: "${ex.name}" (ID: ${ex.id})`);
            const results = await searchExerciseFromAPI(ex.name);
            if (results && results.length > 0) {
                const bestMatch = results[0];
                const updateRes = await db.update(exercises)
                    .set({
                        gifUrl: bestMatch.gifUrl,
                        muscleGroup: bestMatch.targetMuscle,
                        equipment: bestMatch.equipment,
                        updatedAt: new Date()
                    })
                    .where(eq(exercises.id, ex.id))
                    .returning({ id: exercises.id });

                if (updateRes.length > 0) {
                    console.log(`[Persistence V4] "${ex.name}" atualizado.`);
                    syncedCount++;
                    revalidatePath("/dashboard/workout");
                } else {
                    console.warn(`[Persistence V4] FALHA ao atualizar "${ex.name}" (ID: ${ex.id})`);
                }
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
            console.error(`[Persistence V4] Erro em "${ex.name}":`, e);
        }
    }

    return { success: true, count: syncedCount };
}
