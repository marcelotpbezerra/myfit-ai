"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { healthStats, userSettings, biometrics } from "@/db/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addHealthStat(type: string, value: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.insert(healthStats).values({
        userId,
        type,
        value,
    });

    revalidatePath("/dashboard/health");
    revalidatePath("/dashboard");
}

export async function getWaterHistory(days = 7) {
    const { userId } = await auth();
    if (!userId) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const result = await db.select({
        date: sql<string>`DATE(recorded_at)`,
        total: sql<number>`sum(CAST(value AS INTEGER))`,
    })
        .from(healthStats)
        .where(
            and(
                eq(healthStats.userId, userId),
                eq(healthStats.type, "water"),
                gte(healthStats.recordedAt, startDate)
            )
        )
        .groupBy(sql`DATE(recorded_at)`)
        .orderBy(sql`DATE(recorded_at)`);

    return result;
}

export async function getLatestStats() {
    const { userId } = await auth();
    if (!userId) return {};

    const stats = await db.query.healthStats.findMany({
        where: eq(healthStats.userId, userId),
        orderBy: [desc(healthStats.recordedAt)],
    });

    // Agrupa pelos tipos mais recentes
    const latest: Record<string, any> = {};
    stats.forEach(s => {
        if (s.type && !latest[s.type]) {
            latest[s.type] = s.value;
        }
    });

    return latest;
}

export async function updateAIContext(context: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.insert(userSettings)
        .values({ userId, aiContext: context })
        .onConflictDoUpdate({
            target: userSettings.userId,
            set: { aiContext: context, updatedAt: new Date() },
        });

    revalidatePath("/dashboard/health");
}

export async function getAIContext() {
    const { userId } = await auth();
    if (!userId) return "";

    const settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
    });

    return settings?.aiContext || "";
}

// Re-export original functions with slight adjustments if needed
export async function addWaterLog(amountMl: number) {
    return addHealthStat("water", amountMl.toString());
}

export async function getTodayWater() {
    const { userId } = await auth();
    if (!userId) return 0;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await db.select({
        total: sql<number>`sum(CAST(value AS INTEGER))`,
    })
        .from(healthStats)
        .where(
            and(
                eq(healthStats.userId, userId),
                eq(healthStats.type, "water"),
                gte(healthStats.recordedAt, startOfDay)
            )
        );

    return result[0]?.total || 0;
}

export async function updateWaterGoal(goalMl: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.insert(userSettings)
        .values({ userId, waterGoal: goalMl })
        .onConflictDoUpdate({
            target: userSettings.userId,
            set: { waterGoal: goalMl, updatedAt: new Date() },
        });

    revalidatePath("/dashboard");
    return { success: true };
}

export async function getWaterGoal() {
    const { userId } = await auth();
    if (!userId) return 3000;

    const settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
    });

    return settings?.waterGoal || 3000;
}

export async function updateBiometricSetting(enabled: boolean) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    await db.insert(userSettings)
        .values({ userId, biometricEnabled: enabled })
        .onConflictDoUpdate({
            target: userSettings.userId,
            set: { biometricEnabled: enabled, updatedAt: new Date() },
        });

    revalidatePath("/dashboard");
    return { success: true };
}

export async function getUserSettings() {
    const { userId } = await auth();
    if (!userId) return null;

    const settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
    });

    return settings;
}

export async function getBiometricsHistory() {
    const { userId } = await auth();
    if (!userId) return [];

    return await db.query.biometrics.findMany({
        where: eq(biometrics.userId, userId),
        orderBy: [desc(biometrics.recordedAt)],
    });
}

export async function getLatestBiometrics() {
    const { userId } = await auth();
    if (!userId) return null;

    return await db.query.biometrics.findFirst({
        where: eq(biometrics.userId, userId),
        orderBy: [desc(biometrics.recordedAt)],
    });
}

export async function saveHealthSyncData(data: { type: 'sleep_hours' | 'steps'; value: string; date: string }[]) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    for (const item of data) {
        const itemDate = new Date(item.date);
        const startOfDay = new Date(itemDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(itemDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Verifica se já existe um registro desse tipo para esse dia
        const existing = await db.query.healthStats.findFirst({
            where: and(
                eq(healthStats.userId, userId),
                eq(healthStats.type, item.type),
                gte(healthStats.recordedAt, startOfDay),
                sql`${healthStats.recordedAt} <= ${endOfDay}`
            )
        });

        if (existing) {
            await db.update(healthStats)
                .set({ value: item.value })
                .where(eq(healthStats.id, existing.id));
        } else {
            await db.insert(healthStats).values({
                userId,
                type: item.type,
                value: item.value,
                recordedAt: itemDate,
            });
        }
    }

    revalidatePath("/dashboard/health");
    return { success: true };
}

export async function getSyncHistory(days = 7) {
    const { userId } = await auth();
    if (!userId) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const stats = await db.query.healthStats.findMany({
        where: and(
            eq(healthStats.userId, userId),
            sql`${healthStats.type} IN ('sleep_hours', 'steps')`,
            gte(healthStats.recordedAt, startDate)
        ),
        orderBy: [desc(healthStats.recordedAt)],
    });

    return stats;
}
