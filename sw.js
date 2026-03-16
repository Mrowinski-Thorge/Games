// Service Worker for Escape Road
// Provides offline-first functionality with cache-first strategy

const CACHE_NAME = 'escape-road-v1';
const RUNTIME_CACHE = 'escape-road-runtime-v1';

// Files to cache immediately on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/Escape-Road/index.html',
    '/Escape-Road/script.js',
    '/Escape-Road/style.css'
];

// ============================================
// Install Event - Cache all resources
// ============================================
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');

    event.waitUntil(
        (async () => {
            try {
                // Open cache
                const cache = await caches.open(CACHE_NAME);

                console.log('📦 Caching local files...');
                // Cache local files
                await cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })));

                console.log('✅ Service Worker installed and cached all resources');

                // Force activate immediately
                await self.skipWaiting();
            } catch (error) {
                console.error('❌ Service Worker install failed:', error);
            }
        })()
    );
});

// ============================================
// Activate Event - Clean up old caches
// ============================================
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');

    event.waitUntil(
        (async () => {
            // Clean up old caches
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map(name => {
                        console.log(`🗑️ Deleting old cache: ${name}`);
                        return caches.delete(name);
                    })
            );

            // Take control of all pages immediately
            await self.clients.claim();

            console.log('✅ Service Worker activated');
        })()
    );
});

// ============================================
// Fetch Event - Cache-first strategy
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome extensions and other protocols
    if (!url.protocol.startsWith('http')) {
        return;
    }

    event.respondWith(
        (async () => {
            try {
                // Try cache first (Cache-First Strategy)
                const cachedResponse = await caches.match(request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                console.log(`🌐 Fetching from network: ${url.pathname}`);
                const networkResponse = await fetch(request);

                // Cache successful responses for future use (Runtime caching)
                if (networkResponse.ok) {
                    const cache = await caches.open(RUNTIME_CACHE);
                    cache.put(request, networkResponse.clone());
                    console.log(`💾 Cached for next time: ${url.pathname}`);
                }

                return networkResponse;
            } catch (error) {
                console.error(`❌ Fetch failed for ${url.pathname}:`, error);

                // Try cache as fallback for network errors
                const cachedResponse = await caches.match(request);
                if (cachedResponse) {
                    console.log(`📦 Serving stale cache: ${url.pathname}`);
                    return cachedResponse;
                }

                // Return offline page or error
                if (request.destination === 'document') {
                    const cache = await caches.open(CACHE_NAME);
                    const offlinePage = await cache.match('/index.html');
                    if (offlinePage) {
                        return offlinePage;
                    }
                }

                // Last resort: return basic error response
                return new Response('Offline und keine gecachte Version verfügbar', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                        'Content-Type': 'text/plain; charset=utf-8'
                    })
                });
            }
        })()
    );
});

// ============================================
// Message Event - For cache updates
// ============================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(RUNTIME_CACHE).then((cache) => {
                return cache.addAll(event.data.urls);
            })
        );
    }
});

console.log('📝 Service Worker script loaded');
