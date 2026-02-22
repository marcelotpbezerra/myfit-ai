"use client";

import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { saveHealthSyncData } from "@/actions/health";

/**
 * Biblioteca para integração com Saúde (HealthKit/Health Connect).
 * Requer o plugin: @capgo/capacitor-health
 */

export async function syncHealthData() {
    if (!Capacitor.isNativePlatform()) {
        toast.error("Integração de saúde disponível apenas em dispositivos móveis.");
        return;
    }

    try {
        // @ts-ignore
        const { Health } = await import("@capgo/capacitor-health");

        // 1. Verificar disponibilidade
        const { value: isAvailable } = await Health.isAvailable();
        if (!isAvailable) {
            toast.error("Serviços de saúde não estão disponíveis neste dispositivo.");
            return;
        }

        // 2. Solicitar Permissões
        // @capgo usa readonly e write arrays com strings simplificadas
        await Health.requestPermissions({
            readonly: ["steps", "sleep"],
            write: []
        });

        // 3. Buscar Dados (Últimos 7 dias)
        const endTime = new Date();
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - 7);

        const syncPayload: { type: 'sleep_hours' | 'steps'; value: string; date: string }[] = [];

        // Fetch Steps
        const stepsResponse = await Health.query({
            sampleName: "steps",
            startDate: startTime.toISOString(),
            endDate: endTime.toISOString()
        });

        // Agrupar passos por dia
        const stepsByDay: Record<string, number> = {};
        stepsResponse.values.forEach((r: any) => {
            const date = (r.startDate || r.endDate).split('T')[0];
            stepsByDay[date] = (stepsByDay[date] || 0) + (Number(r.value) || 0);
        });

        Object.entries(stepsByDay).forEach(([date, count]) => {
            syncPayload.push({ type: 'steps', value: Math.round(count).toString(), date });
        });

        // Fetch Sleep
        const sleepResponse = await Health.query({
            sampleName: "sleep",
            startDate: startTime.toISOString(),
            endDate: endTime.toISOString()
        });

        // Agrupar sono por dia (horas)
        const sleepByDay: Record<string, number> = {};
        sleepResponse.values.forEach((r: any) => {
            const date = r.startDate.split('T')[0];
            const durationMs = new Date(r.endDate).getTime() - new Date(r.startDate).getTime();
            const durationHours = durationMs / (1000 * 60 * 60);
            sleepByDay[date] = (sleepByDay[date] || 0) + durationHours;
        });

        Object.entries(sleepByDay).forEach(([date, hours]) => {
            syncPayload.push({ type: 'sleep_hours', value: hours.toFixed(1), date });
        });

        // 4. Salvar no Backend
        if (syncPayload.length > 0) {
            await saveHealthSyncData(syncPayload);
            toast.success("Dados de saúde sincronizados com sucesso!");
        } else {
            toast.info("Tudo atualizado! Nenhum dado novo encontrado.");
        }

    } catch (error) {
        console.error("Health Sync Error:", error);
        toast.error("Erro na sincronização de saúde. Verifique as permissões.");
    }
}
