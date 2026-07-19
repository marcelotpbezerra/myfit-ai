"use client";

import { useEffect, useRef } from "react";
import { initNotifications, NotificationService } from "@/lib/notifications";
import { getUserSettings } from "@/actions/health";
import { listenForWearCommands } from "@/lib/wear-bridge";

export function NotificationInit() {
    const handledCommandIds = useRef(new Set<string>());

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

        let removeListener: () => void = () => {};
        void listenForWearCommands((command) => {
            const commandId = typeof command.commandId === "string" ? command.commandId : "";
            if (commandId && handledCommandIds.current.has(commandId)) return;
            if (commandId) handledCommandIds.current.add(commandId);
            const action = typeof command.action === "string" ? command.action : "";
            const events: Record<string, string> = {
                set_completed: "notification:mark_set_done",
                rest_completed: "notification:start_next_set",
                rest_adjusted: Number(command.deltaSeconds) < 0
                    ? "notification:subtract_10s"
                    : "notification:extend_30s",
            };
            const eventName = events[action];
            if (eventName) window.dispatchEvent(new CustomEvent(eventName));
        }).then((remove) => { removeListener = remove; });
        return () => removeListener();
    }, []);

    return null;
}
