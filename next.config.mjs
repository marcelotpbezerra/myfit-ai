import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    customWorkerSrc: "worker",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    typescript: { ignoreBuildErrors: true },
    images: { unoptimized: true },
    turbopack: {}, // Empty turbopack config to silence the error as per Next 16 tip
};

export default withPWA(nextConfig);
