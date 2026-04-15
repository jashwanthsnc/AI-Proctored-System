# ATE-PROT — Secure Lockdown Browser

An Electron-based lockdown browser for the AI-Proctored Exam System.  
Runs the exam web app inside a hardened shell that enforces OS-level security controls the browser alone cannot provide.

## What it detects

| Threat | Method | Severity |
|---|---|---|
| OBS, Bandicam, Fraps, Camtasia | Process scan every 3 s | Warning |
| VNC, TeamViewer, AnyDesk, RDP | Process + port scan | Critical |
| Chromecast, AirPlay, Miracast ports | Network port scan every 10 s | Warning |
| SpaceDesk, Parsec VDD (virtual displays) | Display scan every 8 s | Critical |
| Alt+Tab, Win key, PrintScreen | Global shortcut intercept | Warning |
| Screen recording / capture | `setContentProtection(true)` (OS-level) | Blocked |
| Minimise / resize / close during exam | Kiosk fullscreen mode | Blocked |

After **3 critical violations** the exam is automatically force-submitted.

---

## Requirements

- Node.js 18+ and npm
- Windows 10/11 (primary support), macOS 12+, or Linux
- The web app (frontend + backend) must be running before launching the desktop app

---

## Development setup

```bash
# 1. Install dependencies
cd desktop-app
npm install

# 2. Configure the server URL (optional — defaults to http://localhost:3000)
cp .env.example .env
# Edit .env if your server runs on a different host/port

# 3. Start the app (loads the web app from EXAM_SERVER_URL)
npm start
```

The Electron window opens and loads the web app.  
Security lockdown activates automatically when a student navigates to an exam URL (`/exam/` or `/test/`).

---

## Production build

```bash
# Windows installer (.exe via NSIS)
npm run build:win

# macOS disk image (.dmg)
npm run build:mac

# Linux AppImage
npm run build:linux
```

Output goes to `dist/`. The Windows build requests administrator privileges (needed for process and network scanning).

---

## How the integration works

```
Electron main process          React web app (TestPage.jsx)
─────────────────────          ────────────────────────────
processMonitor  ──→ IPC ──→   useDesktopSecurity hook
networkMonitor  ──→ IPC ──→     │── onViolation → cheating log + toast
displayMonitor  ──→ IPC ──→     └── onBlock     → force submit exam
keyboard hooks  ──→ IPC ──→
```

`window.electronSecurity` is exposed via `preload.js` (contextBridge) and is `undefined` in a normal browser, so the web app works unchanged without Electron.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| White screen on launch | Make sure `npm start` (frontend) is running first |
| `ENOENT dotenv` | Run `npm install` in the `desktop-app/` directory |
| Display scan shows nothing | PowerShell execution policy may be restricted — run `Set-ExecutionPolicy RemoteSigned` as admin |
| Build fails: icon not found | Add a 256×256 PNG to `assets/icon.png` |
