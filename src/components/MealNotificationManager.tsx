"use client";

import { useEffect } from "react";
import { NotificationService } from "@/lib/notifications";

export function MealNotificationManager({ dietPlan }: { dietPlan: any[] }) {
    useEffect(() => {
        async function initNotifications() {
            // Pequeno delay para não sobrecarregar o mount inicial
            const timer = setTimeout(async () => {
                const granted = await NotificationService.requestPermissions();
                if (granted) {
                    await NotificationService.scheduleMealReminders(dietPlan);
                }
            }, 3000);

            return () => clearTimeout(timer);
        }

        initNotifications();
    }, [dietPlan]);

    return null; // Componente invisível
}
