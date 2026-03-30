const CACHE_NAME = 'netflix-pwa-v2';
const IMAGE_CACHE_NAME = 'netflix-images-v1';
const DYNAMIC_CACHE_NAME = 'netflix-dynamic-v2';
const MAX_IMAGES = 100;

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/index.css',
    '/favicon.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap',
    'https://cdn.tailwindcss.com'
];

// Helper: Limit Cache Size (LRU)
const limitCacheSize = async (name, size) => {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    if (keys.length > size) {
        await cache.delete(keys[0]);
        limitCacheSize(name, size);
    }
};

// Install: Cache Static Assets
self.addEventListener('install', (event) => {
    // Force new SW to activate immediately
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate: Cleanup Old Caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME && key !== IMAGE_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch Strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. IMAGES (TMDB): Cache First + Limit Size
    if (url.hostname.includes('tmdb.org') || url.href.match(/\.(png|jpg|jpeg|svg|gif)$/)) {
        event.respondWith(
            caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) return cachedResponse;

                try {
                    const networkResponse = await fetch(event.request);
                    cache.put(event.request, networkResponse.clone());
                    limitCacheSize(IMAGE_CACHE_NAME, MAX_IMAGES);
                    return networkResponse;
                } catch (e) {
                    // Fallback placeholder could go here
                    return new Response('', { status: 408, headers: { 'Content-Type': 'image/png' } });
                }
            })
        );
        return;
    }

    // 2. API / FIREBASE: Network First (No Cache)
    if (url.href.includes('firestore') || url.href.includes('googleapis') || url.href.includes('api')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Return simple offline JSON
                return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // 3. NAVIGATION (HTML): Stale-While-Revalidate (or Cache, then Network)
    // For SPA, we usually return index.html for navigation requests
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('/index.html').then((cached) => {
                return cached || fetch(event.request).catch(() => {
                    // If both fail, show offline.html if it existed, or just nothing.
                    return caches.match('/index.html');
                });
            })
        );
        return;
    }

    // 4. DEFAULT (JS/CSS/Other): Stale-While-Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() => cachedResponse); // Return cached if network fails

            return cachedResponse || fetchPromise;
        })
    );
});
