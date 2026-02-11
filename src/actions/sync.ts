"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const DEFAULT_EXERCISES = [
    { name: "Supino Reto", muscleGroup: "Peito", isCustom: false },
    { name: "Agachamento Livre", muscleGroup: "Pernas", isCustom: false },
    { name: "Remada Curvada", muscleGroup: "Costas", isCustom: false },
    { name: "Desenvolvimento Militar", muscleGroup: "Ombros", isCustom: false },
    { name: "Rosca Direta", muscleGroup: "Bíceps", isCustom: false },
    { name: "Tríceps Testa", muscleGroup: "Tríceps", isCustom: false },
];

export async function seedExercises() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Não autorizado");
    }

    // Verifica se o usuário já tem exercícios cadastrados
    const existingExercises = await db.query.exercises.findMany({
        where: eq(exercises.userId, userId),
    });

    if (existingExercises.length === 0) {
        console.log(`Semeando exercícios para o usuário ${userId}...`);

        // Insere os exercícios padrão
        const exercisesToInsert = DEFAULT_EXERCISES.map(ex => ({
            ...ex,
            userId,
        }));

        await db.insert(exercises).values(exercisesToInsert).onConflictDoNothing();

        return { success: true, message: "Exercícios semeados com sucesso!" };
    }

    return { success: true, message: "O usuário já possui exercícios." };
}
