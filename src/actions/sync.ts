"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { exercises, dietPlan } from "@/db/schema";
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

export async function seedDietPlan() {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    const protocol = [
        { mealName: "Café da Manhã", targetProtein: 40, targetCarbs: 60, targetFat: 12, targetCalories: 500, suggestions: "Pão Integral com Ovos ou Cuscuz com Ovos", order: 1 },
        { mealName: "Lanche da Manhã", targetProtein: 40, targetCarbs: 30, targetFat: 8, targetCalories: 350, suggestions: "Iogurte Natural + Whey Protein + Fruta", order: 2 },
        { mealName: "Almoço", targetProtein: 40, targetCarbs: 80, targetFat: 15, targetCalories: 620, suggestions: "Frango/Carne Magra, Arroz/Macarrão e Salada à vontade", order: 3 },
        { mealName: "Pré-Treino", targetProtein: 40, targetCarbs: 60, targetFat: 5, targetCalories: 445, suggestions: "Pão com Frango Desfiado ou Banana com Aveia e Whey", order: 4 },
        { mealName: "Jantar", targetProtein: 40, targetCarbs: 40, targetFat: 10, targetCalories: 410, suggestions: "Omelete (4 ovos) ou Crepioca Recheada com Frango", order: 5 },
        { mealName: "Ceia", targetProtein: 40, targetCarbs: 10, targetFat: 10, targetCalories: 290, suggestions: "Whey Protein 40g + Pasta de Amendoim + 100ml Leite Desnatado", order: 6 },
    ];

    // Limpa plano anterior e insere o novo (para garantir que seja o protocolo 2026)
    await db.delete(dietPlan).where(eq(dietPlan.userId, userId));

    await db.insert(dietPlan).values(
        protocol.map(p => ({ ...p, userId }))
    );

    return { success: true };
}
