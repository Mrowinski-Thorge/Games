// ============================================
// Escape Road App - Simplified Offline Support
// ============================================

class EscapeRoadApp {
    constructor() {
        this.db = null;
        this.autoSaveInterval = null;
        this.init();
    }

    async init() {
        console.log('🎮 Escape Road initializing...');

        // Initialize IndexedDB
        await this.initDatabase();

        // Register Service Worker
        await this.registerServiceWorker();

        // Load saved game state
        await this.restoreGameState();

        // Start auto-save
        this.startAutoSave();

        // Prevent accidental navigation
        window.addEventListener('beforeunload', (e) => {
            this.captureGameState(true); // Final save
        });

        console.log('✅ Escape Road ready!');
    }

    // ============================================
    // IndexedDB Management
    // ============================================

    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EscapeRoadDB', 1);

            request.onerror = () => {
                console.error('❌ IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB connected');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create game state store
                if (!db.objectStoreNames.contains('gameState')) {
                    const objectStore = db.createObjectStore('gameState', { keyPath: 'id' });
                    objectStore.createIndex('lastSaved', 'lastSaved', { unique: false });
                    console.log('📦 Created gameState object store');
                }
            };
        });
    }

    async saveGameState(state) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gameState'], 'readwrite');
            const objectStore = transaction.objectStore('gameState');

            const gameData = {
                id: 'escape-road',
                state: state,
                lastSaved: new Date().toISOString()
            };

            const request = objectStore.put(gameData);

            request.onsuccess = () => {
                console.log('💾 Game state saved');
                resolve();
            };

            request.onerror = () => {
                console.error('❌ Error saving state:', request.error);
                reject(request.error);
            };
        });
    }

    async loadGameState() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gameState'], 'readonly');
            const objectStore = transaction.objectStore('gameState');
            const request = objectStore.get('escape-road');

            request.onsuccess = () => {
                if (request.result) {
                    console.log('📂 Loaded saved state');
                    resolve(request.result);
                } else {
                    console.log('ℹ️ No saved state found');
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error('❌ Error loading state:', request.error);
                reject(request.error);
            };
        });
    }

    // ============================================
    // Service Worker Registration
    // ============================================

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered:', registration.scope);

                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 Service Worker update found');
                });
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        } else {
            console.warn('⚠️ Service Workers not supported');
        }
    }

    // ============================================
    // Game State Management
    // ============================================

    async restoreGameState() {
        try {
            const savedData = await this.loadGameState();

            if (savedData && savedData.state) {
                console.log('🔄 Restoring saved game state');

                // Wait for game to initialize
                setTimeout(() => {
                    try {
                        if (window.setGameState) {
                            window.setGameState(savedData.state.gameState);
                            console.log('✅ Game state restored via API');
                        } else if (window.myGame && savedData.state.gameState) {
                            const gs = savedData.state.gameState;
                            if (gs.score !== undefined) window.myGame.score = gs.score;
                            if (gs.highScore !== undefined) window.myGame.highScore = gs.highScore;
                            console.log('✅ Game state restored directly');
                        }
                    } catch (e) {
                        console.warn('Could not restore game state:', e);
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('❌ Error restoring state:', error);
        }
    }

    // ============================================
    // Auto-Save System
    // ============================================

    startAutoSave() {
        // Save every 3 seconds
        this.autoSaveInterval = setInterval(() => {
            this.captureGameState(false);
        }, 3000);

        console.log('⏱️ Auto-save started (every 3 seconds)');
    }

    async captureGameState(isFinal = false) {
        try {
            const state = {
                timestamp: Date.now(),
                gameState: null
            };

            // Capture game state using the API
            try {
                if (window.getGameState) {
                    state.gameState = window.getGameState();
                } else if (window.myGame) {
                    state.gameState = {
                        score: window.myGame.score || 0,
                        highScore: window.myGame.highScore || 0,
                        obstacleSpeed: window.myGame.obstacleSpeed || 5,
                        gameOver: window.myGame.gameOver || false
                    };
                }
            } catch (e) {
                console.warn('⚠️ Could not capture game state');
            }

            // Save to IndexedDB
            await this.saveGameState(state);

            if (isFinal) {
                console.log('💾 Final save completed');
            }
        } catch (error) {
            console.error('❌ Error capturing game state:', error);
        }
    }
}

// ============================================
// Initialize App
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.escapeRoadApp = new EscapeRoadApp();
    });
} else {
    window.escapeRoadApp = new EscapeRoadApp();
}
