"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { meals, dietPlan, foods } from "@/db/schema";
import { eq, and, sql, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTodayMacros() {
    const { userId } = await auth();
    if (!userId) return { protein: 0, carbs: 0, fat: 0, calories: 0 };

    const today = new Date().toISOString().split('T')[0];

    const todayMeals = await db.query.meals.findMany({
        where: and(
            eq(meals.userId, userId),
            eq(meals.date, today),
            eq(meals.isCompleted, true)
        ),
    });

    let totals = { protein: 0, carbs: 0, fat: 0, calories: 0 };

    todayMeals.forEach(meal => {
        const items = meal.items as any[];
        if (items && Array.isArray(items)) {
            items.forEach(item => {
                totals.protein += Number(item.protein || 0);
                totals.carbs += Number(item.carbs || 0);
                totals.fat += Number(item.fat || 0);
                const itemCals = (Number(item.protein || 0) * 4) + (Number(item.carbs || 0) * 4) + (Number(item.fat || 0) * 9);
                totals.calories += itemCals;
            });
        }
    });

    return totals;
}

export async function getMealsByDate(date: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    const data = await db.query.meals.findMany({
        where: and(
            eq(meals.userId, userId),
            eq(meals.date, date)
        ),
    });

    return data;
}

export async function saveMeal(mealData: {
    id?: number;
    date: string;
    mealName: string;
    items: any[];
    isCompleted?: boolean;
    notes?: string;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    if (mealData.id) {
        // Update
        await db.update(meals)
            .set({
                mealName: mealData.mealName,
                items: mealData.items,
                isCompleted: mealData.isCompleted,
                notes: mealData.notes,
            })
            .where(and(eq(meals.id, mealData.id), eq(meals.userId, userId)));
    } else {
        // Create
        await db.insert(meals).values({
            userId,
            date: mealData.date,
            mealName: mealData.mealName,
            items: mealData.items,
            isCompleted: mealData.isCompleted || false,
            notes: mealData.notes || "",
        });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/meals");
    return { success: true };
}

export async function deleteMeal(id: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.delete(meals).where(and(eq(meals.id, id), eq(meals.userId, userId)));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/meals");
    return { success: true };
}

export async function getDietPlan() {
    const { userId } = await auth();
    if (!userId) return [];

    return await db.query.dietPlan.findMany({
        where: eq(dietPlan.userId, userId),
        orderBy: [asc(dietPlan.order)],
    });
}

export async function toggleMealCompletion(mealId: number, isCompleted: boolean) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.update(meals)
        .set({ isCompleted })
        .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/meals");
    return { success: true };
}

export async function addDietMeal(data: {
    mealName: string;
    scheduledTime: string;
    items?: any[];
    suggestions?: string;
    order: number;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    const items = data.items || [];
    const targetProtein = items.reduce((acc: number, it: any) => acc + Number(it.protein || 0), 0);
    const targetCarbs = items.reduce((acc: number, it: any) => acc + Number(it.carbs || 0), 0);
    const targetFat = items.reduce((acc: number, it: any) => acc + Number(it.fat || 0), 0);
    const targetCalories = (targetProtein * 4) + (targetCarbs * 4) + (targetFat * 9);

    await db.insert(dietPlan).values({
        userId,
        mealName: data.mealName,
        scheduledTime: data.scheduledTime,
        suggestions: data.suggestions || "",
        items,
        targetProtein,
        targetCarbs,
        targetFat,
        targetCalories,
        order: data.order
    });

    revalidatePath("/dashboard/meals");
    return { success: true };
}

export async function updateDietMeal(id: number, data: Partial<{
    mealName: string;
    scheduledTime: string;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    items: any[];
    suggestions: string;
    order: number;
    substitutions: any[];
}>) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    const updateData: any = { ...data };

    if (data.items) {
        const items = data.items;
        updateData.targetProtein = items.reduce((acc: number, it: any) => acc + Number(it.protein || 0), 0);
        updateData.targetCarbs = items.reduce((acc: number, it: any) => acc + Number(it.carbs || 0), 0);
        updateData.targetFat = items.reduce((acc: number, it: any) => acc + Number(it.fat || 0), 0);
        updateData.targetCalories = (updateData.targetProtein * 4) + (updateData.targetCarbs * 4) + (updateData.targetFat * 9);
    } else if (data.targetProtein !== undefined || data.targetCarbs !== undefined || data.targetFat !== undefined) {
        // Fallback for manual macro updates if items not provided (backward compatibility/edge cases)
        const current = await db.query.dietPlan.findFirst({ where: eq(dietPlan.id, id) });
        const p = data.targetProtein !== undefined ? data.targetProtein : (current?.targetProtein || 0);
        const c = data.targetCarbs !== undefined ? data.targetCarbs : (current?.targetCarbs || 0);
        const f = data.targetFat !== undefined ? data.targetFat : (current?.targetFat || 0);
        updateData.targetCalories = (p * 4) + (c * 4) + (f * 9);
    }

    await db.update(dietPlan)
        .set(updateData)
        .where(and(eq(dietPlan.id, id), eq(dietPlan.userId, userId)));

    revalidatePath("/dashboard/meals");
    return { success: true };
}

export async function deleteDietMeal(id: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.delete(dietPlan).where(and(eq(dietPlan.id, id), eq(dietPlan.userId, userId)));

    revalidatePath("/dashboard/meals");
    return { success: true };
}

export async function clearMealLog(mealId: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.update(meals)
        .set({
            items: [],
            isCompleted: false,
            notes: ""
        })
        .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/meals");
    return { success: true };
}

export async function createCustomFood(data: {
    nome: string;
    kcal: number;
    prot: number;
    carb: number;
    gord: number;
    porcao?: string;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    try {
        await db.insert(foods).values({
            userId,
            nome: data.nome,
            kcal: Math.round(data.kcal),
            prot: data.prot.toString(),
            carb: data.carb.toString(),
            gord: data.gord.toString(),
            porcao: data.porcao || "100g",
        });

        revalidatePath("/dashboard/meals");
        return { success: true };
    } catch (error: any) {
        // Erro de PostgreSQL 23505 é Unique Violation
        if (error.message?.includes("unique constraint") || error.code === "23505" || String(error).includes("23505")) {
            return { success: false, error: "Você já possui um alimento cadastrado com este nome." };
        }
        console.error("Erro ao criar alimento customizado:", error);
        return { success: false, error: "Erro ao salvar o alimento no seu catálogo." };
    }
}
