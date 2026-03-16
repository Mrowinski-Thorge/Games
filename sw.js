// Service Worker for Game Hub
// Provides offline-first functionality with cache-first strategy

const CACHE_NAME = 'game-hub-v1';
const RUNTIME_CACHE = 'game-hub-runtime-v1';

// Files to cache immediately on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    // Game directories
    '/Drive-Mad/index.html',
    '/Poly-Track/index.html',
    '/Escape-Road/index.html',
    '/Escape-Road/script.js',
    '/Escape-Road/style.css'
];

// External CDN resources to cache (from game files)
const EXTERNAL_RESOURCES = [
    // Poly-Track CDN resources
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/message_box_ui.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/customization.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/debug_ui.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/editor.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/editor_height_selector.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/hint.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/loading_ui.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/menu.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/speedometer.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/theme.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/time_announcer.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/timer.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/track_export_ui.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/track_selection_ui.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/css/transition_system.css',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@e46f2d7f33015cf93201e664a2e493800c03284d/pt/lib/ammo.js',
    'https://cdn.jsdelivr.net/gh/wergboy/NLP@22f6094b69b1c9d45e17a82e93a41b7d88f99574/pt/dist/bundle.js',
    // Drive-Mad CDN resources
    'https://deckard.openprocessing.org/user485717/visual2458132/hf42bec4b58ab09712c0f3bedb92cada1/index.wasm.js',
    'https://deckard.openprocessing.org/user485717/visual2458132/hf42bec4b58ab09712c0f3bedb92cada1/index.data.js'
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
                // Cache local files first
                await cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })));

                console.log('🌐 Caching external resources...');
                // Cache external resources (CDN files)
                // We do this separately to handle failures gracefully
                await Promise.allSettled(
                    EXTERNAL_RESOURCES.map(async (url) => {
                        try {
                            const response = await fetch(url, {
                                mode: 'cors',
                                cache: 'force-cache'
                            });
                            if (response.ok) {
                                await cache.put(url, response);
                                console.log(`✅ Cached: ${url}`);
                            } else {
                                console.warn(`⚠️ Failed to cache: ${url} (${response.status})`);
                            }
                        } catch (error) {
                            console.error(`❌ Error caching: ${url}`, error);
                        }
                    })
                );

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
                    // console.log(`📦 Serving from cache: ${url.pathname}`);
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

// ============================================
// Periodic Background Sync (if supported)
// ============================================
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-game-data') {
        event.waitUntil(
            // Could sync game data to server here if needed
            Promise.resolve()
        );
    }
});

console.log('📝 Service Worker script loaded');
