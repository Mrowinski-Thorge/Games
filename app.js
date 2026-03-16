// ============================================
// Game Hub App - Main Application Logic
// ============================================

class GameHub {
    constructor() {
        this.db = null;
        this.currentGame = null;
        this.autoSaveInterval = null;
        this.init();
    }

    async init() {
        console.log('🎮 Game Hub initializing...');

        // Initialize IndexedDB
        await this.initDatabase();

        // Register Service Worker
        await this.registerServiceWorker();

        // Setup event listeners
        this.setupEventListeners();

        // Update online/offline status
        this.updateOnlineStatus();

        // Load last save times for all games
        await this.updateAllSaveTimes();

        console.log('✅ Game Hub ready!');
    }

    // ============================================
    // IndexedDB Management
    // ============================================

    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('GameHubDB', 1);

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

                // Create game states store
                if (!db.objectStoreNames.contains('gameStates')) {
                    const objectStore = db.createObjectStore('gameStates', { keyPath: 'gameName' });
                    objectStore.createIndex('lastSaved', 'lastSaved', { unique: false });
                    console.log('📦 Created gameStates object store');
                }
            };
        });
    }

    async saveGameState(gameName, state) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gameStates'], 'readwrite');
            const objectStore = transaction.objectStore('gameStates');

            const gameData = {
                gameName: gameName,
                state: state,
                lastSaved: new Date().toISOString()
            };

            const request = objectStore.put(gameData);

            request.onsuccess = () => {
                console.log(`💾 Game state saved for ${gameName}`);
                this.updateSaveTime(gameName, gameData.lastSaved);
                resolve();
            };

            request.onerror = () => {
                console.error(`❌ Error saving state for ${gameName}:`, request.error);
                reject(request.error);
            };
        });
    }

    async loadGameState(gameName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gameStates'], 'readonly');
            const objectStore = transaction.objectStore('gameStates');
            const request = objectStore.get(gameName);

            request.onsuccess = () => {
                if (request.result) {
                    console.log(`📂 Loaded state for ${gameName}`);
                    resolve(request.result);
                } else {
                    console.log(`ℹ️ No saved state for ${gameName}`);
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error(`❌ Error loading state for ${gameName}:`, request.error);
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
    // Event Listeners
    // ============================================

    setupEventListeners() {
        // Play buttons
        document.querySelectorAll('.play-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const gameName = e.currentTarget.getAttribute('data-game');
                this.loadGame(gameName);
            });
        });

        // Home button
        document.getElementById('homeButton').addEventListener('click', () => {
            this.returnToDashboard();
        });

        // Online/Offline status
        window.addEventListener('online', () => this.updateOnlineStatus());
        window.addEventListener('offline', () => this.updateOnlineStatus());

        // Prevent accidental navigation
        window.addEventListener('beforeunload', (e) => {
            if (this.currentGame) {
                e.preventDefault();
                e.returnValue = '';
                this.captureGameState(true); // Final save
            }
        });
    }

    // ============================================
    // Game Loading & Management
    // ============================================

    async loadGame(gameName) {
        console.log(`🎮 Loading game: ${gameName}`);

        this.currentGame = gameName;

        // Show loading indicator
        document.getElementById('loadingIndicator').style.display = 'flex';

        // Hide dashboard
        document.getElementById('dashboard').style.display = 'none';

        // Get game path
        const gamePath = this.getGamePath(gameName);

        // Load game in iframe
        const iframe = document.getElementById('gameFrame');
        iframe.src = gamePath;

        // Wait for iframe to load
        iframe.onload = async () => {
            console.log(`✅ Game loaded: ${gameName}`);

            // Hide loading, show game container
            document.getElementById('loadingIndicator').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'block';
            document.getElementById('homeButton').style.display = 'flex';

            // Try to restore game state
            await this.restoreGameState(gameName);

            // Start auto-save
            this.startAutoSave();
        };
    }

    getGamePath(gameName) {
        const paths = {
            'drive-mad': '/Drive-Mad/index.html',
            'poly-track': '/Poly-Track/index.html',
            'escape-road': '/Escape-Road/index.html'
        };
        return paths[gameName] || '/';
    }

    async restoreGameState(gameName) {
        try {
            const savedData = await this.loadGameState(gameName);

            if (savedData && savedData.state) {
                console.log(`🔄 Restoring state for ${gameName}`);
                const iframe = document.getElementById('gameFrame');

                // Try to inject saved state into iframe
                try {
                    const iframeWindow = iframe.contentWindow;

                    // Restore localStorage if available
                    if (savedData.state.localStorage) {
                        for (const [key, value] of Object.entries(savedData.state.localStorage)) {
                            try {
                                iframeWindow.localStorage.setItem(key, value);
                            } catch (e) {
                                console.warn('Could not restore localStorage item:', key);
                            }
                        }
                    }

                    // For Escape Road - restore game state
                    if (gameName === 'escape-road' && savedData.state.gameState) {
                        setTimeout(() => {
                            try {
                                if (iframeWindow.setGameState) {
                                    iframeWindow.setGameState(savedData.state.gameState);
                                    console.log('✅ Restored game state via API');
                                } else if (iframeWindow.myGame) {
                                    const gs = savedData.state.gameState;
                                    if (gs.score) iframeWindow.myGame.score = gs.score;
                                    if (gs.highScore) iframeWindow.myGame.highScore = gs.highScore;
                                    console.log('✅ Restored game state directly');
                                }
                            } catch (e) {
                                console.warn('Could not restore game state:', e);
                            }
                        }, 500);
                    }

                    console.log('✅ State restored');
                } catch (e) {
                    console.warn('⚠️ Could not access iframe content:', e);
                }
            }
        } catch (error) {
            console.error('❌ Error restoring state:', error);
        }
    }

    // ============================================
    // Auto-Save System
    // ============================================

    startAutoSave() {
        // Clear any existing interval
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        // Save every 3 seconds
        this.autoSaveInterval = setInterval(() => {
            this.captureGameState(false);
        }, 3000);

        console.log('⏱️ Auto-save started (every 3 seconds)');
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('⏹️ Auto-save stopped');
        }
    }

    async captureGameState(isFinal = false) {
        if (!this.currentGame) return;

        try {
            const iframe = document.getElementById('gameFrame');
            const iframeWindow = iframe.contentWindow;

            const state = {
                timestamp: Date.now(),
                url: iframe.src,
                localStorage: {},
                sessionStorage: {},
                gameState: null
            };

            // Try to capture localStorage
            try {
                const localStorageData = {};
                for (let i = 0; i < iframeWindow.localStorage.length; i++) {
                    const key = iframeWindow.localStorage.key(i);
                    localStorageData[key] = iframeWindow.localStorage.getItem(key);
                }
                state.localStorage = localStorageData;
            } catch (e) {
                console.warn('⚠️ Could not access iframe localStorage');
            }

            // Try to capture sessionStorage
            try {
                const sessionStorageData = {};
                for (let i = 0; i < iframeWindow.sessionStorage.length; i++) {
                    const key = iframeWindow.sessionStorage.key(i);
                    sessionStorageData[key] = iframeWindow.sessionStorage.getItem(key);
                }
                state.sessionStorage = sessionStorageData;
            } catch (e) {
                console.warn('⚠️ Could not access iframe sessionStorage');
            }

            // Game-specific state capture
            if (this.currentGame === 'escape-road') {
                try {
                    // Try to use the API function first
                    if (iframeWindow.getGameState) {
                        state.gameState = iframeWindow.getGameState();
                    } else if (iframeWindow.myGame) {
                        state.gameState = {
                            score: iframeWindow.myGame.score || 0,
                            highScore: iframeWindow.myGame.highScore || 0,
                            obstacleSpeed: iframeWindow.myGame.obstacleSpeed || 5,
                            gameOver: iframeWindow.myGame.gameOver || false
                        };
                    }
                } catch (e) {
                    console.warn('⚠️ Could not capture Escape Road game state');
                }
            }

            // Save to IndexedDB
            await this.saveGameState(this.currentGame, state);

            if (isFinal) {
                console.log('💾 Final save completed');
            }
        } catch (error) {
            console.error('❌ Error capturing game state:', error);
        }
    }

    // ============================================
    // Navigation
    // ============================================

    async returnToDashboard() {
        console.log('🏠 Returning to dashboard');

        // Final save before leaving
        await this.captureGameState(true);

        // Stop auto-save
        this.stopAutoSave();

        // Clear iframe
        const iframe = document.getElementById('gameFrame');
        iframe.src = 'about:blank';

        // Hide game container and home button
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('homeButton').style.display = 'none';

        // Show dashboard
        document.getElementById('dashboard').style.display = 'block';

        // Update save time
        await this.updateAllSaveTimes();

        this.currentGame = null;
    }

    // ============================================
    // UI Updates
    // ============================================

    updateOnlineStatus() {
        const statusIndicator = document.getElementById('onlineStatus');
        const statusText = statusIndicator.querySelector('.status-text');

        if (navigator.onLine) {
            statusIndicator.classList.remove('offline');
            statusText.textContent = 'Online';
        } else {
            statusIndicator.classList.add('offline');
            statusText.textContent = 'Offline';
        }
    }

    async updateAllSaveTimes() {
        const games = ['drive-mad', 'poly-track', 'escape-road'];

        for (const gameName of games) {
            const savedData = await this.loadGameState(gameName);
            if (savedData && savedData.lastSaved) {
                this.updateSaveTime(gameName, savedData.lastSaved);
            }
        }
    }

    updateSaveTime(gameName, isoString) {
        const element = document.querySelector(`.save-time[data-game="${gameName}"]`);
        if (element) {
            const date = new Date(isoString);
            const formatted = this.formatDate(date);
            element.textContent = formatted;
        }
    }

    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Gerade eben';
        if (minutes < 60) return `Vor ${minutes} Minute${minutes > 1 ? 'n' : ''}`;
        if (hours < 24) return `Vor ${hours} Stunde${hours > 1 ? 'n' : ''}`;
        if (days < 7) return `Vor ${days} Tag${days > 1 ? 'en' : ''}`;

        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// ============================================
// Initialize App
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.gameHub = new GameHub();
    });
} else {
    window.gameHub = new GameHub();
}
