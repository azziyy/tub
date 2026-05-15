// Service Worker - VideoFlix PWA
const CACHE_VERSION = 'videoflix-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/variables.css',
    './css/base.css',
    './css/components.css',
    './css/player.css',
    './css/animations.css',
    './css/responsive.css',
    './js/app.js',
    './js/Router.js',
    './api/SheetsAPI.js',
    './utils/Storage.js',
    './utils/Toast.js',
    './utils/Helpers.js',
    './components/VideoCard.js',
    './components/Skeleton.js',
    './components/Player.js',
    './pages/HomePage.js',
    './pages/SearchPage.js',
    './pages/FavoritesPage.js',
    './pages/ProfilePage.js',
    './pages/SettingsPage.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
    'https://fonts.googleapis.com/icon?family=Material+Icons+Round'
];

// Install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.warn('[SW] Some assets failed to cache:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((k) => !k.startsWith(CACHE_VERSION))
                    .map((k) => caches.delete(k))
            );
        })
    );
    self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET
    if (request.method !== 'GET') return;

    // Skip video streams (let browser handle them directly)
    if (url.pathname.endsWith('.mp4') || url.pathname.endsWith('.m3u8') || url.pathname.endsWith('.ts')) {
        return;
    }

    // GViz JSON (Google Sheets) - Network first with cache fallback
    if (url.hostname.includes('docs.google.com') && url.pathname.includes('gviz')) {
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
        return;
    }

    // Images - Cache first
    if (request.destination === 'image') {
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
        return;
    }

    // Static assets - Cache first
    event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// Cache strategies
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        return new Response('Offline', { status: 503 });
    }
}

async function networkFirst(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Background sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-favorites') {
        event.waitUntil(syncFavorites());
    }
});

async function syncFavorites() {
    // Placeholder for future server sync
    console.log('[SW] Sync favorites');
}
