"use client";

import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { saveHealthSyncData } from "@/actions/health";

/**
 * Biblioteca para integração com Google Health Connect.
 * Requer o plugin: @capacitor-community/health-connect
 */

export async function syncHealthData() {
    if (!Capacitor.isNativePlatform()) {
        toast.error("Health Connect está disponível apenas no aplicativo Android.");
        return;
    }

    try {
        // @ts-ignore - Plugin será instalado no ambiente nativo do usuário
        const { HealthConnect } = await import("@capacitor-community/health-connect");

        // 1. Verificar disponibilidade
        const { isAvailable } = await HealthConnect.checkAvailability();
        if (!isAvailable) {
            toast.error("Google Health Connect não está disponível neste dispositivo.");
            return;
        }

        // 2. Solicitar Permissões
        const permissions = {
            read: ["SleepSession", "Steps"],
            write: []
        };

        const { grantedPermissions } = await HealthConnect.requestPermission({
            permissions
        } as any);

        if (grantedPermissions.length === 0) {
            toast.warning("Permissões do Health Connect negadas.");
            return;
        }

        // 3. Buscar Dados (Últimos 7 dias)
        const endTime = new Date();
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - 7);

        const syncPayload: { type: 'sleep_hours' | 'steps'; value: string; date: string }[] = [];

        // Fetch Steps
        const stepsResponse = await HealthConnect.readRecords({
            type: "Steps",
            timeRangeFilter: {
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            }
        } as any);

        // Agrupar passos por dia
        const stepsByDay: Record<string, number> = {};
        stepsResponse.records.forEach((r: any) => {
            const date = r.startTime.split('T')[0];
            stepsByDay[date] = (stepsByDay[date] || 0) + (r.count || 0);
        });

        Object.entries(stepsByDay).forEach(([date, count]) => {
            syncPayload.push({ type: 'steps', value: count.toString(), date });
        });

        // Fetch Sleep
        const sleepResponse = await HealthConnect.readRecords({
            type: "SleepSession",
            timeRangeFilter: {
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            }
        } as any);

        // Agrupar sono por dia (horas)
        const sleepByDay: Record<string, number> = {};
        sleepResponse.records.forEach((r: any) => {
            const date = r.startTime.split('T')[0];
            const durationMs = new Date(r.endTime).getTime() - new Date(r.startTime).getTime();
            const durationHours = durationMs / (1000 * 60 * 60);
            sleepByDay[date] = (sleepByDay[date] || 0) + durationHours;
        });

        Object.entries(sleepByDay).forEach(([date, hours]) => {
            syncPayload.push({ type: 'sleep_hours', value: hours.toFixed(1), date });
        });

        // 4. Salvar no Backend
        if (syncPayload.length > 0) {
            await saveHealthSyncData(syncPayload);
            toast.success("Sincronização com Health Connect concluída!");
        } else {
            toast.info("Nenhum dado novo para sincronizar.");
        }

    } catch (error) {
        console.error("Health Sync Error:", error);
        toast.error("Erro ao sincronizar com Health Connect.");
    }
}
