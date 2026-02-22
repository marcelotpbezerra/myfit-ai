"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

// Identificadores consistentes para o sistema
export const NOTIFICATION_CATEGORIES = {
    WORKOUT_REST: "WORKOUT_REST",
    MEAL_REMINDER: "MEAL_REMINDER",
};

export const NOTIFICATION_ACTIONS = {
    SKIP_REST: "SKIP_REST",
    CONFIRM_MEAL: "CONFIRM_MEAL",
    OPEN_APP: "OPEN_APP",
};

export const NotificationService = {
    async requestPermissions() {
        if (!Capacitor.isNativePlatform()) {
            if (!("Notification" in window)) return false;
            const permission = await Notification.requestPermission();
            return permission === "granted";
        }
        const { display } = await LocalNotifications.requestPermissions();
        return display === "granted";
    },

    async init() {
        if (!Capacitor.isNativePlatform()) return;

        try {
            // 1. Criar Canal para Android (Alta Importância para Timers)
            await LocalNotifications.createChannel({
                id: "workout",
                name: "Treino e Descanso",
                description: "Notificações de timer e descanso de treino",
                importance: 5, // High
                visibility: 1,
                vibration: true,
            });

            // 2. Registrar Categorias e Ações (WearOS / Apple Watch)
            await LocalNotifications.registerActionTypes({
                types: [
                    {
                        id: NOTIFICATION_CATEGORIES.WORKOUT_REST,
                        actions: [
                            {
                                id: NOTIFICATION_ACTIONS.SKIP_REST,
                                title: "Pular Descanso",
                                foreground: true,
                            },
                            {
                                id: NOTIFICATION_ACTIONS.OPEN_APP,
                                title: "Abrir no App",
                                foreground: true,
                            }
                        ]
                    }
                ]
            });

            // 3. Listener Global de Ações
            LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
                const { actionId } = notificationAction;
                if (actionId === NOTIFICATION_ACTIONS.SKIP_REST) {
                    window.dispatchEvent(new CustomEvent('notification:skip_rest'));
                }
            });

            console.log("NotificationService: Canais e Categorias inicializados.");
        } catch (e) {
            console.error("Erro ao inicializar NotificationService:", e);
        }
    },

    async scheduleRestNotification(seconds: number) {
        const title = "🔥 Descanso Finalizado!";
        const body = "Hora da próxima série. Vamos pra cima!";

        if (!Capacitor.isNativePlatform()) {
            if ("Notification" in window && Notification.permission === "granted") {
                // Fallback para Web (não agendado nativamente pelo browser, usamos timer local)
                setTimeout(() => {
                    new Notification(title, {
                        body,
                        icon: "/icons/icon-192x192.png",
                        tag: "rest-timer"
                    });
                }, seconds * 1000);
            }
            return;
        }

        const scheduleDate = new Date(Date.now() + seconds * 1000);
        await LocalNotifications.schedule({
            notifications: [
                {
                    title,
                    body,
                    id: 1001,
                    schedule: { at: scheduleDate },
                    sound: "beep.wav",
                    channelId: "workout",
                    actionTypeId: NOTIFICATION_CATEGORIES.WORKOUT_REST,
                    extra: { type: "rest_finish" }
                }
            ]
        });
    },

    async scheduleMealReminders(dietPlan: any[]) {
        if (!Capacitor.isNativePlatform() || !dietPlan.length) return;

        try {
            // Limpa agendamentos anteriores (IDs 200+)
            await LocalNotifications.cancel({
                notifications: Array.from({ length: 10 }, (_, i) => ({ id: 200 + i }))
            });

            const notifications = dietPlan
                .filter(p => p.scheduledTime || p.time)
                .map((plan, idx) => {
                    const timeStr = plan.scheduledTime || plan.time || "08:00";
                    const [hours, minutes] = timeStr.split(":").map(Number);
                    const scheduleDate = new Date();
                    scheduleDate.setHours(hours, minutes, 0, 0);

                    if (scheduleDate < new Date()) {
                        scheduleDate.setDate(scheduleDate.getDate() + 1);
                    }

                    return {
                        title: `🍽️ Hora da Refeição: ${plan.mealName || plan.name}`,
                        body: plan.suggestions || "Consulte seu plano e registre o que comer.",
                        id: 200 + idx,
                        schedule: { at: scheduleDate, repeats: true, every: "day" as const, allowWhileIdle: true },
                        channelId: "workout",
                        extra: { mealId: plan.id, type: "meal_reminder" }
                    };
                });

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
            }
        } catch (e) {
            console.error("Erro ao agendar refeições:", e);
        }
    }
};

// Funções para manter compatibilidade com componentes que importam diretamente
export const initNotifications = () => NotificationService.init();
export const scheduleRestNotification = (s: number) => NotificationService.scheduleRestNotification(s);
