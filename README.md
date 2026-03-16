# 🎮 Game Hub - Offline-First PWA

Eine Progressive Web App (PWA), die drei Spiele in einer zentralen Hub-Website vereint: **Drive Mad**, **Poly-Track** und **Escape Road**. Die App funktioniert nach dem ersten Laden zu 100% offline und speichert automatisch alle Spielstände.

## ✨ Features

### 🌐 Offline-First
- **Service Worker** mit Cache-First Strategy
- Alle Assets werden beim ersten Besuch gecacht
- Vollständige Funktionalität ohne Internetverbindung
- CDN-Ressourcen werden lokal gespeichert

### 💾 Automatische Speicherung
- **IndexedDB** für persistente Spielstände
- Auto-Save alle 3 Sekunden
- Letzter Spielstand wird beim Neustart wiederhergestellt
- Zeitstempel für jeden gespeicherten Stand

### 🎯 Spiele

1. **Drive Mad** - Verrücktes Fahrspiel mit Physik-Herausforderungen
2. **Poly-Track** - Rasantes 3D-Rennspiel
3. **Escape Road** - Hindernissen ausweichen und Power-Ups sammeln

### 🎨 Modernes UI
- Responsive Design für alle Geräte
- Dunkles Theme
- Floating Home-Button über den Spielen
- Animierte Spielvorschauen
- Online/Offline-Statusanzeige

### 📱 PWA-Funktionen
- Installierbar auf Handy und Desktop
- App-Icons und Splash Screen
- Vollbild-Modus beim Spielen
- App-Shortcuts zu einzelnen Spielen

## 🚀 Installation

### Lokale Entwicklung

1. Repository klonen:
```bash
git clone https://github.com/Mrowinski-Thorge/Games.git
cd Games
```

2. Mit einem lokalen Server starten (z.B. mit Python):
```bash
python3 -m http.server 8000
# oder
python -m SimpleHTTPServer 8000
```

3. Im Browser öffnen:
```
http://localhost:8000
```

### Als PWA installieren

1. Website im Browser öffnen
2. Im Browser-Menü "Zu Startbildschirm hinzufügen" oder "Installieren" wählen
3. App wie eine native App nutzen

## 📁 Projektstruktur

```
Games/
├── index.html          # Haupt-Dashboard
├── style.css           # Styling und Layout
├── app.js              # Hauptlogik (IndexedDB, Navigation)
├── sw.js               # Service Worker für Offline-Support
├── manifest.json       # PWA-Manifest
├── icon-192.svg/png    # App-Icons
├── icon-512.svg/png    # App-Icons
├── Drive-Mad/          # Drive Mad Spiel
│   └── index.html
├── Poly-Track/         # Poly-Track Spiel
│   └── index.html
└── Escape-Road/        # Escape Road Spiel
    ├── index.html
    ├── script.js
    └── style.css
```

## 🔧 Technische Details

### Service Worker (sw.js)
- **Cache-First Strategy**: Alle Ressourcen werden zuerst aus dem Cache geladen
- **Runtime Caching**: Neue Ressourcen werden automatisch gecacht
- **Offline Fallback**: Bei fehlender Internetverbindung wird gecachte Version verwendet

### IndexedDB (app.js)
- **Object Store**: `gameStates` für Spielstände
- **Auto-Save**: Alle 3 Sekunden wird der aktuelle Zustand gespeichert
- **State Capture**: LocalStorage, SessionStorage und Game-spezifische Daten

### Game State Management
Für jedes Spiel werden folgende Daten gespeichert:
- LocalStorage-Inhalte
- SessionStorage-Inhalte
- Game-spezifischer Zustand (Score, Level, etc.)
- Timestamp des letzten Speicherns

### Escape Road API
Das Escape Road Spiel wurde erweitert mit:
- `window.getGameState()` - Liefert aktuellen Spielstand
- `window.setGameState(state)` - Stellt Spielstand wieder her

## 🎮 Spielsteuerung

### Dashboard
- Klick auf "Spielen" startet das jeweilige Spiel
- Letzter Spielstand wird automatisch geladen

### In-Game
- **Home-Button** (oben links) → Zurück zum Dashboard
  - Speichert automatisch vor dem Verlassen
- Browser-Back → Warnung + Auto-Save

### Escape Road Steuerung
- **Leertaste**: Springen
- **Leertaste** (Game Over): Neustarten

## 🌐 Browser-Kompatibilität

Die App funktioniert in allen modernen Browsern:
- ✅ Chrome/Edge (empfohlen)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

Service Worker und IndexedDB werden von allen modernen Browsern unterstützt.

## 🔐 Datenschutz

- Alle Daten werden **lokal** im Browser gespeichert
- Keine Server-Kommunikation erforderlich
- Keine Tracking oder Analytics
- Daten bleiben auf dem Gerät

## 📝 Lizenz

Die einzelnen Spiele unterliegen ihren jeweiligen Lizenzen:
- Drive Mad: Externe Ressourcen von OpenProcessing
- Poly-Track: CDN-Ressourcen von GitHub/jsdelivr
- Escape Road: Eigenentwicklung

## 🤝 Beitragen

Verbesserungen und Bug-Fixes sind willkommen!

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Committe deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## 🐛 Bekannte Probleme

- Poly-Track und Drive Mad nutzen externe CDN-Ressourcen
  - Diese werden beim ersten Laden gecacht
  - Bei Updates der CDN-Ressourcen muss der Cache geleert werden
- Iframe-Cross-Origin-Beschränkungen können State-Capture einschränken

## 📚 Weiterführende Ressourcen

- [Progressive Web Apps](https://web.dev/progressive-web-apps/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

Made with ❤️ for offline gaming
