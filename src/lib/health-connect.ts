"use client";

import { Capacitor } from "@capacitor/core";

/**
 * Biblioteca para abstração do Health Connect (Android) e HealthKit (iOS).
 * Foco inicial: Sono.
 */

export interface SleepData {
    startTime: string;
    endTime: string;
    source: string;
}

export async function checkHealthPermissions() {
    if (!Capacitor.isNativePlatform()) return false;

    // TODO: Implementar usando @capacitor-community/health-connect ou similar
    console.log("Checking Health Connect permissions...");
    return true;
}

export async function getSleepHistory(): Promise<SleepData[]> {
    if (!Capacitor.isNativePlatform()) return [];

    console.log("Fetching sleep data from native bridge...");

    // Mock data para simulação enquanto o plugin nativo é configurado no Android Studio
    return [
        {
            startTime: new Date(Date.now() - 86400000 * 1).toISOString(),
            endTime: new Date(Date.now() - 86400000 * 1 + 28800000).toISOString(),
            source: "Health Connect (Stub)"
        }
    ];
}

export async function syncHealthData() {
    if (!Capacitor.isNativePlatform()) return;

    try {
        const sleep = await getSleepHistory();
        console.log("Health Data Synced:", sleep);
    } catch (error) {
        console.error("Health Sync Error:", error);
    }
}
