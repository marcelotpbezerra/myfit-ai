// Simple Service Worker to allow PWA installation
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
});

self.addEventListener('fetch', (event) => {
    // Basic pass-through
});
