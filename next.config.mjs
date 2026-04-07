import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    // Mantém SW ativo em dev para facilitar testes offline
    disable: false,
    register: true,
    skipWaiting: true,
    // Worker customizado com estratégias de cache + background sync
    customWorkerSrc: "worker",
    // Garante que o SW seja atualizado ao abrir o app
    reloadOnOnline: true,
    // Cache de páginas da app para acesso offline
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    // Fallback offline para navegação sem cache
    fallbacks: {
        document: "/offline",
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    typescript: { ignoreBuildErrors: true },
    images: { unoptimized: true },
    turbopack: {}, // Empty turbopack config to silence the error as per Next 16 tip
};

export default withPWA(nextConfig);
