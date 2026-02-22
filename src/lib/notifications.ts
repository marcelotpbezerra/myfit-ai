"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export const NOTIFICATION_CATEGORIES = {
    WORKOUT_REST: "WORKOUT_REST",
    MEAL_REMINDER: "MEAL_REMINDER",
};

export const NOTIFICATION_ACTIONS = {
    SKIP_REST: "SKIP_REST",
    CONFIRM_MEAL: "CONFIRM_MEAL",
    OPEN_APP: "OPEN_APP",
};

export async function initNotifications() {
    if (!Capacitor.isNativePlatform()) return;

    try {
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display !== 'granted') return;

        // Register Categories for Actionable Notifications
        // Note: Using registerActionTypes for compatibility if setCategories is a lint error
        await (LocalNotifications as any).registerActionTypes?.({
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

        // Some versions use setCategories
        if (!(LocalNotifications as any).registerActionTypes) {
            await (LocalNotifications as any).setCategories?.({
                categories: [
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
        }

        // Global Action Listener
        LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
            const { actionId, notification } = notificationAction;

            console.log(`Notification action: ${actionId}`, notification);

            if (actionId === NOTIFICATION_ACTIONS.SKIP_REST) {
                // This event can be listened to by WorkoutExecution.tsx
                window.dispatchEvent(new CustomEvent('notification:skip_rest'));
            }

            if (actionId === NOTIFICATION_ACTIONS.CONFIRM_MEAL) {
                // Here we could call a server action via fetch if foreground is false
                console.log("Confirm Meal action triggered in background");
            }
        });

    } catch (error) {
        console.error("Error initializing notifications:", error);
    }
}

export async function scheduleRestNotification(seconds: number) {
    if (!Capacitor.isNativePlatform()) return;

    await LocalNotifications.schedule({
        notifications: [
            {
                title: "Descanso Ativo",
                body: `Seu descanso termina em ${seconds}s.`,
                id: 101,
                schedule: { at: new Date(Date.now() + seconds * 1000) },
                sound: 'beep.wav',
                channelId: 'workout',
                actionTypeId: NOTIFICATION_CATEGORIES.WORKOUT_REST,
            }
        ]
    });
}

export const NotificationService = {
    async requestPermissions() {
        if (!Capacitor.isNativePlatform()) return false;
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
    },

    async scheduleMealReminders(dietPlan: any[]) {
        if (!Capacitor.isNativePlatform() || !dietPlan.length) return;

        // Limpar anteriores
        await LocalNotifications.cancel({ notifications: [{ id: 200 }, { id: 201 }, { id: 202 }] });

        const notifications = dietPlan.map((meal, index) => {
            const [hours, minutes] = (meal.time || "08:00").split(':').map(Number);
            const now = new Date();
            const scheduleDate = new Date();
            scheduleDate.setHours(hours, minutes, 0, 0);

            // Se o horário já passou hoje, agendar para amanhã
            if (scheduleDate <= now) {
                scheduleDate.setDate(scheduleDate.getDate() + 1);
            }

            return {
                title: `Hora de Comer: ${meal.name}`,
                body: `Lembrete para sua refeição: ${meal.suggestions || 'Confira seu plano!'}`,
                id: 200 + index,
                schedule: { at: scheduleDate, repeats: true, allowWhileIdle: true },
                sound: 'beep.wav',
                actionTypeId: NOTIFICATION_CATEGORIES.MEAL_REMINDER,
            };
        });

        await LocalNotifications.schedule({ notifications });
    }
};
