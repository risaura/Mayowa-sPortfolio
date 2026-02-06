# 🎮 Mayowa's Game Portfolio

An interactive pixel-art game portfolio featuring a walking character, cherry blossom scenery, 6 playable mini-games, and a jazz soundtrack.

## 🚀 Features

- **Pixel Art Character** — Walk left/right through a beautiful cherry blossom world
- **Day/Night Cycle** — Automatic transitions every 90 seconds
- **6 Mini-Games** — Flappy Bird, Snake, Pong, Slither Python, Brick Breaker, Space Invaders
- **Jazz Music** — Generated via Web Audio API (no files needed)
- **14 Achievements** — Unlock trophies by playing games and exploring
- **Space Loading Screen** — Stars, moon, planet, animated rocket
- **Falling Cherry Blossoms** — Animated petals drifting across the screen
- **Interactive Signs** — Click wooden signs to open About Me and Games panels

## 📁 Files

| File | Description |
|------|-------------|
| `index.html` | Main HTML structure with all modals and UI |
| `styles.css` | Complete stylesheet — pixel art aesthetic |
| `audio.js` | Jazz music generator via Web Audio API |
| `achievements.js` | Achievement system with local storage |
| `loader.js` | Space-themed loading screen |
| `games.js` | All 6 mini-games |
| `main.js` | Core scene engine — character, cherry blossoms, day/night, camera |

## 🎯 How to Play

1. Open `index.html` in any modern browser
2. Wait for the loading screen to finish
3. Use **← →** arrow keys to walk the character left and right
4. **Click** the wooden signs to open About Me or Games
5. **Click** the character for fun speech bubbles
6. Toggle **🎵 Music** in the top-left HUD
7. View **🏆 Achievements** to track your progress

## 🕹️ Game Controls

| Game | Controls |
|------|----------|
| Flappy Bird | Click or Space to flap |
| Snake | Arrow keys or WASD |
| Pong | W/S or ↑/↓ keys |
| Slither Python | ← → to steer |
| Brick Breaker | Mouse or ← → keys |
| Space Invaders | ← → to move, Space to shoot |

## 🌐 Deploy to GitHub Pages

1. Push all files to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to **main** branch, root folder
4. Your portfolio will be live at `https://yourusername.github.io/reponame/`

## 💡 Tips for VS Code

1. Install the **Live Server** extension
2. Right-click `index.html` → "Open with Live Server"
3. The portfolio will open with hot-reload on save

## 🎨 Customization

- Edit the **About Me** section directly in `index.html`
- Adjust **day/night cycle** speed in `main.js` → `dayNight.cycleLen`
- Change **cherry blossom colors** in `main.js` → `blossomHue`
- Modify **game difficulty** in `games.js` (speed, gap size, etc.)

---

Made with ❤️ by Mayowa
