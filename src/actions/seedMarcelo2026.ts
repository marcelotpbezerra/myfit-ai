"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { dietPlan } from "@/db/schema";
import { eq } from "drizzle-orm";

const MARCELO_PROTOCOL_2026 = [
    {
        order: 1,
        scheduledTime: "08:00",
        mealName: "Café da Manhã",
        targetProtein: 50,
        targetCarbs: 30,
        targetFat: 15,
        targetCalories: 450,
        suggestions: "Cuscuz (120g) + 3 ovos + 100g frango grelhado",
        substitutions: [
            { item: "Cuscuz (120g)", canReplace: "Pão integral, tapioca, batata doce", protein: 4, carbs: 23, fat: 0.3 },
            { item: "3 Ovos", canReplace: "Omelete de claras (6 claras)", protein: 18, carbs: 1, fat: 0 },
            { item: "Frango (100g)", canReplace: "Peito de peru, atum", protein: 31, carbs: 0, fat: 3.6 }
        ]
    },
    {
        order: 2,
        scheduledTime: "10:00",
        mealName: "Lanche Manhã",
        targetProtein: 30,
        targetCarbs: 5,
        targetFat: 10,
        targetCalories: 230,
        suggestions: "Whey isolado (1 scoop) + 10g pasta de amendoim",
        substitutions: [
            { item: "Whey isolado", canReplace: "Whey concentrado, albumina", protein: 24, carbs: 2, fat: 1.5 },
            { item: "Pasta amendoim (10g)", canReplace: "Amendoim natural, castanhas", protein: 3, carbs: 2, fat: 8 }
        ]
    },
    {
        order: 3,
        scheduledTime: "12:00",
        mealName: "Almoço",
        targetProtein: 55,
        targetCarbs: 45,
        targetFat: 15,
        targetCalories: 535,
        suggestions: "150g arroz integral + 220g frango grelhado + 1 colher azeite",
        substitutions: [
            { item: "Arroz integral (150g)", canReplace: "Batata doce, macarrão integral, quinoa", protein: 4, carbs: 42, fat: 0.5 },
            { item: "Frango (220g)", canReplace: "Carne vermelha magra, peixe, ovos", protein: 68, carbs: 0, fat: 8 },
            { item: "Azeite (1 colher)", canReplace: "Abacate, castanhas", protein: 0, carbs: 0, fat: 14 }
        ]
    },
    {
        order: 4,
        scheduledTime: "17:00",
        mealName: "Pré-Treino",
        targetProtein: 45,
        targetCarbs: 30,
        targetFat: 10,
        targetCalories: 390,
        suggestions: "Iogurte natural (200g) + 40g whey + granola + pasta amendoim",
        substitutions: [
            { item: "Iogurte natural (200g)", canReplace: "Iogurte grego, kefir", protein: 7, carbs: 9, fat: 3 },
            { item: "Whey (40g)", canReplace: "Albumina, caseína", protein: 32, carbs: 2, fat: 1.5 },
            { item: "Granola", canReplace: "Aveia, frutas", protein: 3, carbs: 15, fat: 2 }
        ]
    },
    {
        order: 5,
        scheduledTime: "20:00",
        mealName: "Pós-Treino/Jantar",
        targetProtein: 60,
        targetCarbs: 25,
        targetFat: 10,
        targetCalories: 430,
        suggestions: "180-200g frango + vegetais à vontade + 100g batata/cuscuz",
        substitutions: [
            { item: "Frango (180-200g)", canReplace: "Peixe, carne vermelha magra, ovos", protein: 62, carbs: 0, fat: 7 },
            { item: "Batata/Cuscuz (100g)", canReplace: "Batata doce, arroz integral", protein: 2, carbs: 20, fat: 0.1 },
            { item: "Vegetais", canReplace: "Brócolis, couve-flor, abobrinha, salada", protein: 2, carbs: 5, fat: 0 }
        ]
    },
    {
        order: 6,
        scheduledTime: "22:30",
        mealName: "Ceia Proteica",
        targetProtein: 30,
        targetCarbs: 3,
        targetFat: 12,
        targetCalories: 240,
        suggestions: "1 scoop whey protein + 15g pasta de amendoim",
        substitutions: [
            { item: "Whey protein (1 scoop)", canReplace: "Caseína, albumina, queijo cottage", protein: 24, carbs: 2, fat: 1.5 },
            { item: "Pasta amendoim (15g)", canReplace: "Amendoim natural, castanhas", protein: 4, carbs: 2, fat: 12 }
        ]
    }
];

export async function seedMarceloProtocol() {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    // Verificar se já existe plano para este usuário
    const existing = await db.query.dietPlan.findFirst({
        where: eq(dietPlan.userId, userId),
    });

    // Se já existe, não faz nada (evita duplicação)
    if (existing) {
        return { success: true, message: "Plano já existe" };
    }

    // Inserir todas as 6 refeições
    await db.insert(dietPlan).values(
        MARCELO_PROTOCOL_2026.map(meal => ({
            userId,
            ...meal
        }))
    );

    return { success: true, message: "Protocolo Marcelo 2026 carregado!" };
}
