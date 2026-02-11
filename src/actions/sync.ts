"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { exercises, dietPlan } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const PROTOCOL_2026_EXERCISES = [
    // Treino A - Peito/Tríceps
    { name: "Supino Reto Máquina", muscleGroup: "Peito", split: "A", targetWeight: "40", targetSets: 3, targetReps: 12, targetRestTime: 60, isCustom: false },
    { name: "Supino Inclinado Halter", muscleGroup: "Peito", split: "A", targetWeight: "22", targetSets: 3, targetReps: 12, targetRestTime: 60, isCustom: false },
    { name: "Crucifixo Máquina", muscleGroup: "Peito", split: "A", targetWeight: "100", targetSets: 3, targetReps: 12, targetRestTime: 60, isCustom: false },
    { name: "Tríceps Pulley", muscleGroup: "Tríceps", split: "A", targetWeight: "45", targetSets: 3, targetReps: 12, targetRestTime: 45, isCustom: false },
    { name: "Tríceps Testa", muscleGroup: "Tríceps", split: "A", targetWeight: "20", targetSets: 3, targetReps: 12, targetRestTime: 45, isCustom: false },

    // Treino B - Costas/Bíceps
    { name: "Puxada Aberta", muscleGroup: "Costas", split: "B", targetWeight: "66", targetSets: 3, targetReps: 12, targetRestTime: 60, isCustom: false },
    { name: "Remada Curvada Supinada", muscleGroup: "Costas", split: "B", targetWeight: "38", targetSets: 3, targetReps: 12, targetRestTime: 60, isCustom: false },
    { name: "Remada Baixa Triângulo", muscleGroup: "Costas", split: "B", targetWeight: "50", targetSets: 3, targetReps: 12, targetRestTime: 60, isCustom: false },
    { name: "Pull-over Corda", muscleGroup: "Costas", split: "B", targetWeight: "21", targetSets: 3, targetReps: 12, targetRestTime: 45, isCustom: false },
    { name: "Crucifixo Inverso", muscleGroup: "Costas", split: "B", targetWeight: "40", targetSets: 3, targetReps: 12, targetRestTime: 45, isCustom: false },

    // Treino C - Pernas
    { name: "Leg Press 45", muscleGroup: "Pernas", split: "C", targetWeight: "160", targetSets: 3, targetReps: 12, targetRestTime: 90, isCustom: false },
    { name: "Extensora", muscleGroup: "Pernas", split: "C", targetWeight: "50", targetSets: 3, targetReps: 12, targetRestTime: 60, isCustom: false },
    { name: "Flexora", muscleGroup: "Pernas", split: "C", targetWeight: "45", targetSets: 3, targetReps: 12, targetRestTime: 60, isCustom: false },
    { name: "Cadeira Abdutora", muscleGroup: "Pernas", split: "C", targetWeight: "43", targetSets: 3, targetReps: 12, targetRestTime: 45, isCustom: false },
    { name: "Panturrilha", muscleGroup: "Pernas", split: "C", targetWeight: "60", targetSets: 3, targetReps: 15, targetRestTime: 45, isCustom: false },

    // Treino D - Ombros/Trapézio
    { name: "Desenv. Halteres", muscleGroup: "Ombros", split: "D", targetWeight: "24", targetSets: 3, targetReps: 12, targetRestTime: 60, isCustom: false },
    { name: "Elevação Lateral", muscleGroup: "Ombros", split: "D", targetWeight: "9", targetSets: 5, targetReps: 15, targetRestTime: 45, isCustom: false },
    { name: "Elevação Frontal", muscleGroup: "Ombros", split: "D", targetWeight: "20", targetSets: 3, targetReps: 12, targetRestTime: 45, isCustom: false },
    { name: "Encolhimento", muscleGroup: "Trapézio", split: "D", targetWeight: "60", targetSets: 3, targetReps: 15, targetRestTime: 45, isCustom: false },
];

export async function seedExercises() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Não autorizado");
    }

    console.log(`Limpando e semeando protocolo ABCD para o usuário ${userId}...`);

    // Nota: Deletar exercícios pode falhar se houver logs. 
    // Usamos ON CONFLICT no banco, então aqui vamos apenas garantir que o split seja atualizado se necessário.

    // Insere os exercícios do protocolo 2026
    const exercisesToInsert = PROTOCOL_2026_EXERCISES.map(ex => ({
        ...ex,
        userId,
    }));

    await db.insert(exercises).values(exercisesToInsert).onConflictDoNothing();

    return { success: true, message: "Protocolo ABCD restaurado com sucesso!" };
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
