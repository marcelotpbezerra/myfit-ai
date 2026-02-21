"use client";

import { LocalNotifications } from "@capacitor/local-notifications";
// import { DietPlanItem } from "@/db/schema";

export const NotificationService = {
    async requestPermissions() {
        const { display } = await LocalNotifications.requestPermissions();
        if (display === 'granted') {
            await this.registerActions();
            return true;
        }
        return false;
    },

    async registerActions() {
        await LocalNotifications.registerActionTypes({
            types: [
                {
                    id: 'MEAL_NOTIFICATION',
                    actions: [
                        { id: 'log', title: 'Registrar Plano', foreground: true },
                        { id: 'edit', title: 'Substituir', foreground: true }
                    ]
                }
            ]
        });
    },

    async scheduleMealReminders(dietPlan: any[]) {
        try {
            // 1. Cancel existing notifications to avoid duplicates
            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length > 0) {
                await LocalNotifications.cancel(pending);
            }

            const notifications = dietPlan
                .filter(plan => plan.scheduledTime)
                .map((plan, index) => {
                    const [hours, minutes] = plan.scheduledTime.split(":").map(Number);

                    return {
                        title: `🍽️ Hora do ${plan.mealName}!`,
                        body: plan.suggestions || "Confira sua dieta no app.",
                        id: plan.id || index + 1,
                        schedule: {
                            on: {
                                hour: hours,
                                minute: minutes
                            },
                            repeats: true,
                            allowWhileIdle: true
                        },
                        sound: 'beep.wav',
                        attachments: [],
                        actionTypeId: "MEAL_NOTIFICATION",
                        extra: {
                            mealId: plan.id,
                            mealName: plan.mealName
                        }
                    };
                });

            if (notifications.length > 0) {
                await LocalNotifications.schedule({
                    notifications: notifications as any
                });
                console.log(`[NOTIFICATIONS] ${notifications.length} lembretes agendados.`);
            }
        } catch (error) {
            console.error("[NOTIFICATIONS] Erro ao agendar:", error);
        }
    }
};
