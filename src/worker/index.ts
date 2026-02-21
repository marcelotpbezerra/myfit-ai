/// <reference lib="webworker" />

const swSelf = self as unknown as ServiceWorkerGlobalScope;

swSelf.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const action = event.action;
    const notificationData = event.notification.data || {};
    const mealId = notificationData.mealId;

    console.log(`[SW] Notification click action: ${action}, mealId: ${mealId}`);

    let url = "/dashboard/meals";
    if (action === "edit" && mealId) {
        url = `/dashboard/meals?mealId=${mealId}&action=edit`;
    }

    event.waitUntil(
        swSelf.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList: readonly any[]) => {
            for (const client of clientList) {
                if (client.url.includes(url) && "focus" in client) {
                    return (client as any).focus();
                }
            }
            if (swSelf.clients.openWindow) {
                return swSelf.clients.openWindow(url);
            }
        })
    );
});
