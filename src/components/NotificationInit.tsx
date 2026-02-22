"use client";

import { useEffect } from "react";
import { initNotifications } from "@/lib/notifications";

export function NotificationInit() {
    useEffect(() => {
        initNotifications();
    }, []);

    return null;
}
