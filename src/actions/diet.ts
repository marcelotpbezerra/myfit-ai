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

    try {
        const todayMeals = await db.query.meals.findMany({
            where: and(
                eq(meals.userId, userId),
                eq(meals.date, today),
                eq(meals.isCompleted, true)
            ),
        });

        let totals = { protein: 0, carbs: 0, fat: 0, calories: 0 };

        todayMeals.forEach(meal => {
            const items = Array.isArray(meal.items) ? (meal.items as any[]) : [];
            items.forEach(item => {
                const p = Number(item.protein || 0);
                const c = Number(item.carbs || 0);
                const f = Number(item.fat || 0);
                totals.protein += isNaN(p) ? 0 : p;
                totals.carbs += isNaN(c) ? 0 : c;
                totals.fat += isNaN(f) ? 0 : f;
                const itemCals = (isNaN(p) ? 0 : p * 4) + (isNaN(c) ? 0 : c * 4) + (isNaN(f) ? 0 : f * 9);
                totals.calories += itemCals;
            });
        });

        return totals;
    } catch (error) {
        console.error("Error in getTodayMacros:", error);
        return { protein: 0, carbs: 0, fat: 0, calories: 0 };
    }
}

export async function getMealsByDate(date: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    try {
        const data = await db.query.meals.findMany({
            where: and(
                eq(meals.userId, userId),
                eq(meals.date, date)
            ),
        });
        return data;
    } catch (error) {
        console.error("Error in getMealsByDate:", error);
        return [];
    }
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

    // Sanitizar todos os campos numéricos dos itens antes de salvar no JSONB
    const sanitizedItems = (Array.isArray(mealData.items) ? mealData.items : []).map((it: any) => ({
        food: String(it.food || "Alimento"),
        protein: isNaN(Number(it.protein)) ? 0 : Number(it.protein),
        carbs: isNaN(Number(it.carbs)) ? 0 : Number(it.carbs),
        fat: isNaN(Number(it.fat)) ? 0 : Number(it.fat),
        qty: isNaN(Number(it.qty)) ? 100 : Number(it.qty),
    }));

    try {
        if (mealData.id) {
            // Update
            await db.update(meals)
                .set({
                    mealName: mealData.mealName,
                    items: sanitizedItems,
                    isCompleted: mealData.isCompleted,
                    notes: mealData.notes,
                })
                .where(and(eq(meals.id, mealData.id), eq(meals.userId, userId)));
        } else {
            // UPSERT: cria ou atualiza se já existe (userId, date, mealName) — evita duplicatas
            await db.insert(meals).values({
                userId,
                date: mealData.date,
                mealName: mealData.mealName,
                items: sanitizedItems,
                isCompleted: mealData.isCompleted || false,
                notes: mealData.notes || "",
            }).onConflictDoUpdate({
                target: [meals.userId, meals.date, meals.mealName],
                set: {
                    items: sanitizedItems,
                    isCompleted: mealData.isCompleted || false,
                    notes: mealData.notes || "",
                },
            });
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/meals");
        return { success: true };
    } catch (error: any) {
        console.error("ERRO AO SALVAR REFEIÇÃO:", {
            message: error?.message,
            code: error?.code,
            detail: error?.detail,
            stack: error?.stack,
        });
        console.error("PAYLOAD TENTADO:", JSON.stringify({
            id: mealData.id,
            date: mealData.date,
            mealName: mealData.mealName,
            isCompleted: mealData.isCompleted,
            sanitizedItems,
        }, null, 2));
        return { success: false, error: "Falha ao salvar a refeição" };
    }
}

export async function deleteMeal(id: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    try {
        await db.delete(meals).where(and(eq(meals.id, id), eq(meals.userId, userId)));
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/meals");
        return { success: true };
    } catch (error) {
        console.error("Error in deleteMeal:", error);
        return { success: false, error: "Falha ao excluir refeição" };
    }
}

export async function getDietPlan() {
    const { userId } = await auth();
    if (!userId) return [];

    try {
        return await db.query.dietPlan.findMany({
            where: eq(dietPlan.userId, userId),
            orderBy: [asc(dietPlan.order)],
        });
    } catch (error) {
        console.error("Error in getDietPlan:", error);
        return [];
    }
}

export async function toggleMealCompletion(mealId: number, isCompleted: boolean) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    try {
        await db.update(meals)
            .set({ isCompleted })
            .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/meals");
        return { success: true };
    } catch (error) {
        console.error("Error in toggleMealCompletion:", error);
        return { success: false, error: "Falha ao atualizar status da refeição" };
    }
}

export async function addDietMeal(data: {
    mealName: string;
    scheduledTime: string;
    items?: any[];
    substitutions?: any[];
    suggestions?: string;
    order: number;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    try {
        const items = Array.isArray(data.items) ? data.items : [];
        const rawProtein = items.reduce((acc: number, it: any) => acc + (isNaN(Number(it.protein)) ? 0 : Number(it.protein)), 0);
        const rawCarbs = items.reduce((acc: number, it: any) => acc + (isNaN(Number(it.carbs)) ? 0 : Number(it.carbs)), 0);
        const rawFat = items.reduce((acc: number, it: any) => acc + (isNaN(Number(it.fat)) ? 0 : Number(it.fat)), 0);
        const targetProtein = Math.round(rawProtein);
        const targetCarbs = Math.round(rawCarbs);
        const targetFat = Math.round(rawFat);
        const targetCalories = Math.round((rawProtein * 4) + (rawCarbs * 4) + (rawFat * 9));

        await db.insert(dietPlan).values({
            userId,
            mealName: data.mealName,
            scheduledTime: data.scheduledTime,
            suggestions: data.suggestions || "",
            items,
            substitutions: Array.isArray(data.substitutions) ? data.substitutions : [],
            targetProtein,
            targetCarbs,
            targetFat,
            targetCalories,
            order: data.order
        });

        revalidatePath("/dashboard/meals");
        return { success: true };
    } catch (error) {
        console.error("Error in addDietMeal:", error);
        return { success: false, error: "Falha ao adicionar refeição ao plano" };
    }
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

    try {
        const updateData: any = { ...data };

        if (data.items) {
            const items = Array.isArray(data.items) ? data.items : [];
            const rawProtein = items.reduce((acc: number, it: any) => acc + (isNaN(Number(it.protein)) ? 0 : Number(it.protein)), 0);
            const rawCarbs = items.reduce((acc: number, it: any) => acc + (isNaN(Number(it.carbs)) ? 0 : Number(it.carbs)), 0);
            const rawFat = items.reduce((acc: number, it: any) => acc + (isNaN(Number(it.fat)) ? 0 : Number(it.fat)), 0);
            updateData.targetProtein = Math.round(rawProtein);
            updateData.targetCarbs = Math.round(rawCarbs);
            updateData.targetFat = Math.round(rawFat);
            updateData.targetCalories = Math.round((rawProtein * 4) + (rawCarbs * 4) + (rawFat * 9));
            updateData.items = items;
        } else if (data.targetProtein !== undefined || data.targetCarbs !== undefined || data.targetFat !== undefined) {
            const current = await db.query.dietPlan.findFirst({ where: eq(dietPlan.id, id) });
            const p = data.targetProtein !== undefined ? data.targetProtein : (current?.targetProtein || 0);
            const c = data.targetCarbs !== undefined ? data.targetCarbs : (current?.targetCarbs || 0);
            const f = data.targetFat !== undefined ? data.targetFat : (current?.targetFat || 0);
            updateData.targetCalories = Math.round((p * 4) + (c * 4) + (f * 9));
        }

        if (data.substitutions) {
            updateData.substitutions = Array.isArray(data.substitutions) ? data.substitutions : [];
        }

        await db.update(dietPlan)
            .set(updateData)
            .where(and(eq(dietPlan.id, id), eq(dietPlan.userId, userId)));

        revalidatePath("/dashboard/meals");
        return { success: true };
    } catch (error) {
        console.error("Error in updateDietMeal:", error);
        return { success: false, error: "Falha ao atualizar refeição do plano" };
    }
}

export async function deleteDietMeal(id: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    try {
        await db.delete(dietPlan).where(and(eq(dietPlan.id, id), eq(dietPlan.userId, userId)));
        revalidatePath("/dashboard/meals");
        return { success: true };
    } catch (error) {
        console.error("Error in deleteDietMeal:", error);
        return { success: false, error: "Falha ao excluir refeição do protocolo" };
    }
}

export async function clearMealLog(mealId: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    try {
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
    } catch (error) {
        console.error("Error in clearMealLog:", error);
        return { success: false, error: "Falha ao limpar registro" };
    }
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
