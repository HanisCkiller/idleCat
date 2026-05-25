import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen, powerMonitor, session } from 'electron';
import path from 'path';

const IDLE_THRESHOLD_SECONDS = 60; // consider user idle after 60s no input

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Allow click-through on transparent areas
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Prevent window from being closed via OS — only quit via tray menu
  mainWindow.on('close', (e) => {
    e.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Use a simple fallback icon if custom one doesn't exist
  const iconPath = path.join(__dirname, '../public/icon.png');
  let icon: Electron.NativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('IdleCat — 陪你一起写 bug');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'IdleCat 🐱',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Show Cat',
      click: () => {
        mainWindow?.showInactive(); // show without stealing focus
        mainWindow?.webContents.send('set-pet-visible', true);
      },
    },
    {
      label: 'Hide Cat',
      click: () => {
        // Don't hide the window — just tell renderer to hide the cat element
        mainWindow?.webContents.send('set-pet-visible', false);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit IdleCat',
      click: () => {
        mainWindow?.removeAllListeners('close');
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Single click tray icon toggles cat visibility
  tray.on('click', () => {
    mainWindow?.webContents.send('toggle-pet-visible');
  });
}

// IPC: renderer asks main to toggle mouse event passthrough
ipcMain.on('set-ignore-mouse-events', (_event, ignore: boolean) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

app.whenReady().then(() => {
  // Grant geolocation permission so weather API can use navigator.geolocation
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'geolocation') {
      callback(true);
    } else {
      callback(false);
    }
  });

  createWindow();
  createTray();

  // ── Activity detection via powerMonitor ──────────────────────────────────
  // Poll system idle time every 30s; send active/idle signal to renderer
  let wasIdle = false;
  const sendActivity = (idle: boolean) => {
    if (mainWindow) {
      mainWindow.webContents.send('user-activity', !idle);
    }
  };

  const idlePoller = setInterval(() => {
    const idleSecs = powerMonitor.getSystemIdleTime();
    const isIdle = idleSecs >= IDLE_THRESHOLD_SECONDS;
    if (isIdle !== wasIdle) {
      wasIdle = isIdle;
      sendActivity(isIdle);
    }
  }, 30_000);

  // Lock screen / sleep → idle immediately
  powerMonitor.on('lock-screen', () => { wasIdle = true; sendActivity(true); });
  powerMonitor.on('suspend',     () => { wasIdle = true; sendActivity(true); });
  // Unlock / resume → active immediately
  powerMonitor.on('unlock-screen', () => { wasIdle = false; sendActivity(false); });
  powerMonitor.on('resume',        () => { wasIdle = false; sendActivity(false); });

  app.on('before-quit', () => clearInterval(idlePoller));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
