# IdleCat 🐱

A desktop companion app for developers. IdleCat sits on your screen, reacts to how you're using your computer, and gently reminds you to take breaks.

Built with Electron + React + TypeScript.

---

## Features

**Screen time tracking**
Tracks how long you've been actively using your screen using system-level idle detection (`powerMonitor`). Pauses when you step away, lock your screen, or the system sleeps. Resets daily.

**1-hour usage reminder**
After 60 minutes of continuous screen use, the cat stretches and nudges you to get up and drink some water.

**Pomodoro timer**
Built-in focus timer with configurable duration. The cat's eyes glow green while the timer is running. Shows a speech bubble reminder when the session ends.

**Adaptive poses**
- Sitting with wagging tail — default idle state
- Green glowing eyes — focus/timer active
- Lying down — nighttime (22:00–07:00) or rest state
- Stretch animation — when reminding you to take a break
- ZZZ bubbles — sleeping at night

**Mini-animations**
Every 5 minutes during idle, the cat randomly performs one of: head shake, grooming, or playing with a ball, make the cat itself more playable and fun.

**Live weather**
Fetches real weather from Open-Meteo using your location (geolocation with IP fallback). Displays rain, snow, clouds, or sunshine effects behind the cat.

**Draggable**
Drag the cat anywhere on your screen. Position is saved between sessions.

**Dark mode & customization**
Toggle dark/light mode, adjust cat size and opacity, show/hide the timer overlay.

**System tray**
Runs in the background via the menu bar. Show/hide the cat from the tray icon.

---

## Tech Stack

- **Electron** — desktop shell, system tray, powerMonitor idle detection
- **React + TypeScript** — UI and component logic
- **Zustand** — state management with persistence
- **Tailwind CSS** — styling
- **Vite** — dev server and bundler
- **Open-Meteo API** — free weather data (no API key required)

---

## Development

```bash
npm install
npm run dev
```

Runs Vite dev server + Electron concurrently. DevTools open automatically in dev mode.

```bash
npm run build
```

Builds the renderer and packages the app with `electron-builder`.

---

## Project Structure

```
electron/
  main.ts       — Electron main process, window setup, powerMonitor, tray
  preload.ts    — IPC bridge between main and renderer
src/
  App.tsx       — Root component, timer logic, screen time tracking
  store.ts      — Zustand store (state + persistence)
  components/
    Pet.tsx     — Cat SVG poses, animations, drag/click handling
    Settings.tsx — Settings panel + debug tools
    Stats.tsx   — Activity log / today's usage
    WeatherEffect.tsx — Rain/snow/cloud particle effects
  services/
    weatherService.ts — Open-Meteo + geolocation + IP fallback
  types/
    types.ts    — Shared TypeScript types
```
