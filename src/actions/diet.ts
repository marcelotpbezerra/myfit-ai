"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { meals, dietPlan } from "@/db/schema";
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
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    suggestions: string;
    order: number;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.insert(dietPlan).values({
        userId,
        ...data,
        targetCalories: (data.targetProtein * 4) + (data.targetCarbs * 4) + (data.targetFat * 9)
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
    suggestions: string;
    order: number;
    substitutions: any[];
}>) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    const updateData: any = { ...data };
    if (data.targetProtein !== undefined || data.targetCarbs !== undefined || data.targetFat !== undefined) {
        // Recalcular calorias se algum macro mudar
        updateData.targetCalories = (Number(data.targetProtein || 0) * 4) +
            (Number(data.targetCarbs || 0) * 4) +
            (Number(data.targetFat || 0) * 9);
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
