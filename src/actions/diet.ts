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
