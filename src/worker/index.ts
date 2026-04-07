/// <reference lib="webworker" />

const swSelf = self as unknown as ServiceWorkerGlobalScope;

// ─── Cache names ──────────────────────────────────────────────────────────────

const CACHE_STATIC = "myfit-static-v1";
const CACHE_PAGES = "myfit-pages-v1";

// Recursos essenciais para funcionamento offline
const PRECACHE_URLS = [
    "/",
    "/dashboard",
    "/dashboard/workout",
    "/dashboard/meals",
    "/dashboard/health",
    "/dashboard/history",
    "/manifest.json",
];

// ─── Install: pré-cacheia recursos estáticos essenciais ───────────────────────

swSelf.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_STATIC)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => swSelf.skipWaiting())
    );
});

// ─── Activate: remove caches antigos ─────────────────────────────────────────

swSelf.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k !== CACHE_STATIC && k !== CACHE_PAGES)
                        .map((k) => caches.delete(k))
                )
            )
            .then(() => swSelf.clients.claim())
    );
});

// ─── Fetch: estratégia por tipo de recurso ────────────────────────────────────

swSelf.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignora requisições cross-origin
    if (url.origin !== location.origin) return;

    // Server Actions e API Routes → Network First com fallback offline
    if (url.pathname.startsWith("/api/") || request.method === "POST") {
        event.respondWith(networkFirstWithFallback(request));
        return;
    }

    // Assets estáticos (JS, CSS, imagens, fontes) → Cache First
    if (url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp)$/)) {
        event.respondWith(cacheFirst(request, CACHE_STATIC));
        return;
    }

    // Páginas da app → Network First com fallback para cache
    if (
        request.mode === "navigate" ||
        request.headers.get("accept")?.includes("text/html")
    ) {
        event.respondWith(networkFirstWithCache(request, CACHE_PAGES));
        return;
    }

    // Resto → Network First padrão
    event.respondWith(networkFirstWithFallback(request));
});

// ─── Estratégias de cache ─────────────────────────────────────────────────────

async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
    }
    return response;
}

async function networkFirstWithCache(
    request: Request,
    cacheName: string
): Promise<Response> {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Retorna a home como fallback offline para navegação
        const fallback = await caches.match("/");
        return fallback ?? new Response("Offline", { status: 503 });
    }
}

async function networkFirstWithFallback(request: Request): Promise<Response> {
    try {
        return await fetch(request);
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(
            JSON.stringify({ error: "offline", message: "Sem conexão com a internet" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
        );
    }
}

// ─── Background Sync ──────────────────────────────────────────────────────────

swSelf.addEventListener("sync", (event: any) => {
    if (event.tag === "myfit-sync-queue") {
        event.waitUntil(notifyClientsToSync());
    }
});

/**
 * O SW não pode chamar server actions diretamente.
 * Notifica todos os clientes abertos para processar a fila de sync.
 */
async function notifyClientsToSync(): Promise<void> {
    const clientList = await swSelf.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
    });
    for (const client of clientList) {
        client.postMessage({ type: "PROCESS_SYNC_QUEUE" });
    }
}

// ─── Notification click ───────────────────────────────────────────────────────

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
        swSelf.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList: readonly any[]) => {
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
