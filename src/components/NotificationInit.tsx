"use client";

import { useEffect } from "react";
import { initNotifications, NotificationService } from "@/lib/notifications";
import { getUserSettings } from "@/actions/health";

export function NotificationInit() {
    useEffect(() => {
        getUserSettings().then(settings => {
            if (settings) {
                NotificationService.setPreferences({
                    notifyWorkoutRest: settings.notifyWorkoutRest ?? true,
                    notifyWorkoutSet: settings.notifyWorkoutSet ?? true,
                    notifyMealReminders: settings.notifyMealReminders ?? false,
                });
            }
            initNotifications();
        });
    }, []);

    return null;
}
