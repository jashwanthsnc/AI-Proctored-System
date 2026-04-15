/**
 * main.js  — Electron main process
 *
 * Secure Lockdown Browser for AI-Proctored Exam System.
 * Loads the web app and applies OS-level security on top:
 *
 *  ✓ Kiosk fullscreen — no minimize, resize, or close during exam
 *  ✓ Blocks Alt+Tab, Win key, Alt+F4, PrintScreen during exam
 *  ✓ Process scan — detects OBS, VNC, TeamViewer, casting apps every 3s
 *  ✓ Network scan — detects Chromecast/AirPlay/Miracast/VNC ports every 10s
 *  ✓ Display scan — detects virtual/extra displays (SpaceDesk, Parsec VDD) every 8s
 *  ✓ Screen capture protection (Windows: SetWindowDisplayAffinity)
 *  ✓ Alerts web app via IPC on every detection
 *  ✓ Auto-submits exam if critical violation count exceeded
 *
 * NOTE: Electron initialises its built-in module registry asynchronously on
 * some Windows setups. require('electron') during synchronous module-load time
 * finds the npm-package shim (which returns the binary path string) instead of
 * the real API.  We therefore defer ALL electron API access to setImmediate(),
 * by which point Electron has completed its browser-process initialisation and
 * re-requiring (after clearing the shim from require.cache) yields the real API.
 */

// ── Load .env config ──────────────────────────────────────────────────────────
try { require('dotenv').config(); } catch {}

const path            = require('path');
const os              = require('os');
const processMonitor  = require('./security/processMonitor');
const networkMonitor  = require('./security/networkMonitor');
const displayMonitor  = require('./security/displayMonitor');

// ── Config ────────────────────────────────────────────────────────────────────
const WEB_APP_URL          = process.env.EXAM_SERVER_URL || 'http://localhost:3000';
const EXAM_PATH_RE         = /\/(exam|test)\//i;
const MAX_CRITICAL_VIOLATIONS = 3;

// ── State ─────────────────────────────────────────────────────────────────────
let mainWindow    = null;
let examActive    = false;
let violations    = [];
let criticalCount = 0;

// ── Electron API (assigned inside setImmediate once the runtime is ready) ─────
let app, BrowserWindow, ipcMain, globalShortcut, dialog, shell, session;

// ── Window setup ──────────────────────────────────────────────────────────────
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    fullscreen: false,
    frame: true,
    autoHideMenuBar: true,
    title: 'ATE-PROT — Secure Exam Browser',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  mainWindow.loadURL(WEB_APP_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(WEB_APP_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  const updateExamState = (_e, url) => {
    const wasActive = examActive;
    examActive = EXAM_PATH_RE.test(url);
    if (examActive && !wasActive)  onExamStarted();
    if (!examActive && wasActive)  onExamEnded();
  };
  mainWindow.webContents.on('did-navigate', updateExamState);
  mainWindow.webContents.on('did-navigate-in-page', updateExamState);

  if (process.platform === 'win32') {
    mainWindow.once('show', () => {
      try { mainWindow.setContentProtection(true); } catch {}
    });
  }

  mainWindow.show();
};

// ── Exam lifecycle ─────────────────────────────────────────────────────────────
const onExamStarted = () => {
  console.log('[Security] Exam started — enabling lockdown');
  violations    = [];
  criticalCount = 0;
  mainWindow.setKiosk(true);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true);
  registerBlockedShortcuts();
  mainWindow.setContentProtection(true);
  scanProcesses();
  scanNetwork();
  scanDisplays();
};

const onExamEnded = () => {
  console.log('[Security] Exam ended — releasing lockdown');
  mainWindow.setKiosk(false);
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setVisibleOnAllWorkspaces(false);
  mainWindow.setContentProtection(false);
  globalShortcut.unregisterAll();
};

// ── Keyboard blocking ─────────────────────────────────────────────────────────
const BLOCKED_SHORTCUTS = [
  'Alt+Tab', 'Alt+F4', 'Super',
  'Meta', 'CommandOrControl+Tab',
  'CommandOrControl+W', 'CommandOrControl+Q',
  'PrintScreen', 'Alt+PrintScreen',
  'F11',
];

const registerBlockedShortcuts = () => {
  globalShortcut.unregisterAll();
  for (const sc of BLOCKED_SHORTCUTS) {
    try {
      globalShortcut.register(sc, () => {
        sendViolation({ type: 'keyboard', severity: 'warning', detail: `Blocked shortcut: ${sc}` });
      });
    } catch {}
  }
};

// ── Violation handling ─────────────────────────────────────────────────────────
const sendViolation = (data) => {
  const violation = { ...data, timestamp: new Date().toISOString(), source: 'desktop' };
  violations.push(violation);
  console.log(`[Security] Violation: ${data.type} — ${data.detail}`);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('security:violation', violation);
  }
  if (data.severity === 'critical') {
    criticalCount++;
    if (criticalCount >= MAX_CRITICAL_VIOLATIONS) {
      forceSubmitExam(`${criticalCount} critical security violations detected`);
    }
  }
};

const sendBlock = (reason) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('security:block', { reason, timestamp: new Date().toISOString() });
  }
};

const forceSubmitExam = (reason) => {
  console.log(`[Security] Force-submitting exam: ${reason}`);
  sendBlock(reason);
  // Fallback: if the web app does not respond within 30 s, release the
  // lockdown ourselves so the student is never permanently trapped.
  setTimeout(() => {
    if (examActive) {
      console.log('[Security] Force-submit timeout — releasing lockdown');
      onExamEnded();
    }
  }, 30000);
};

// ── Process / Network / Display scanning ──────────────────────────────────────
const scanProcesses = () => {
  processMonitor.start(3000, (found) => {
    if (!examActive) return;
    for (const ap of found) {
      sendViolation({
        type: 'process',
        severity: ap.name.toLowerCase().includes('vnc') || ap.name.toLowerCase().includes('remote') ? 'critical' : 'warning',
        detail: `Detected: ${ap.name}`,
        app: ap.name,
      });
    }
  });
};

const scanNetwork = () => {
  networkMonitor.start(10000, (found) => {
    if (!examActive) return;
    for (const conn of found) {
      sendViolation({
        type: 'network',
        severity: 'warning',
        detail: `Suspicious connection: ${conn.name} (port ${conn.port}, ${conn.state})`,
        port: conn.port,
        service: conn.name,
      });
    }
  });
};

const scanDisplays = () => {
  displayMonitor.start(8000, (count, displays) => {
    if (!examActive) return;
    const virtualOnes = displays.filter(d => d.isVirtual);
    sendViolation({
      type: 'display',
      severity: virtualOnes.length > 0 ? 'critical' : 'warning',
      detail: `${count} display(s) detected${virtualOnes.length ? ` (virtual: ${virtualOnes.map(d => d.name).join(', ')})` : ''}`,
      displayCount: count,
      displays,
    });
  });
};

// ── Bootstrap — deferred to let Electron finish browser-process init ──────────
setImmediate(() => {
  // Clear the npm-package shim from the require cache so the built-in wins
  for (const k of Object.keys(require.cache)) {
    if (/node_modules[/\\]electron[/\\]index\.js$/.test(k)) {
      delete require.cache[k];
    }
  }

  const electronAPI = require('electron');

  if (typeof electronAPI !== 'object' || electronAPI === null) {
    console.error('[FATAL] Electron API unavailable (got:', typeof electronAPI, '). Ensure you are running via "electron ." not "node ."');
    process.exit(1);
  }

  ({ app, BrowserWindow, ipcMain, globalShortcut, dialog, shell, session } = electronAPI);

  console.log('[Security] Electron API loaded — process.type:', process.type);

  // ── IPC handlers ─────────────────────────────────────────────────────────
  ipcMain.on('exam:started', (_e, { examId }) => {
    console.log(`[IPC] Exam started: ${examId}`);
    examActive = true;
    onExamStarted();
  });

  ipcMain.on('exam:finished', (_e, { examId }) => {
    console.log(`[IPC] Exam finished: ${examId}`);
    examActive = false;
    onExamEnded();
  });

  ipcMain.handle('security:status', () => ({
    examActive,
    violationCount: violations.length,
    criticalCount,
    recentViolations: violations.slice(-10),
    platform: os.platform(),
    isDesktopApp: true,
  }));

  // ── App lifecycle ─────────────────────────────────────────────────────────
  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
      const allowed = ['media', 'notifications', 'fullscreen', 'clipboard-read', 'clipboard-sanitized-write'];
      cb(allowed.includes(permission));
    });

    createWindow();

    // Pre-exam scanner: logs each suspicious process once. When an exam starts,
    // onExamStarted() calls processMonitor.start() again which stops this and
    // starts the exam-mode scanner (faster interval, sends violations).
    processMonitor.start(5000, (found) => {
      console.log(`[Security] Pre-exam: detected ${found.map(f => f.name).join(', ')}`);
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (examActive) {
      const choice = dialog.showMessageBoxSync({
        type: 'warning',
        buttons: ['Stay', 'Quit Anyway'],
        defaultId: 0,
        title: 'Exam in Progress',
        message: 'An exam is currently in progress. Closing this window will be logged as a violation.',
      });
      if (choice === 0) { createWindow(); return; }
    }
    processMonitor.stop();
    networkMonitor.stop();
    displayMonitor.stop();
    globalShortcut.unregisterAll();
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('will-quit', () => {
    processMonitor.stop();
    networkMonitor.stop();
    displayMonitor.stop();
    globalShortcut.unregisterAll();
  });
});
