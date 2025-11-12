import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { app, BrowserWindow } from 'electron';

// __dirname workaround for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;

function createWindow() {
  // Hidden main window for background processing
  mainWindow = new BrowserWindow({
    width: 1,
    height: 1,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    frame: false,
    transparent: true,
    icon: __dirname + '/public/icon.png'
  });

  // Create overlay window for answers that won't be screen captured
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;

  global.overlayWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    // These are the key settings that prevent screen capture
    type: 'toolbar', // Makes it a special window type
    focusable: false, // Prevents focus and capturing
    hasShadow: false,
  });

  // Load overlay HTML
  overlayWindow.loadURL('file://' + __dirname + '/dist/overlay.html');
  overlayWindow.setIgnoreMouseEvents(true); // Click-through
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  
  // Keep overlay on top
  setInterval(() => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.moveTop();
    }
  }, 1000);

  // Handle IPC for showing answers
  ipcMain.on('show-overlay-answer', (event, answer) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('show-answer', answer);
    }
  });

  // Load the React app
  mainWindow.loadURL('file://' + __dirname + '/dist/index.html');

  // Open DevTools in development (optional)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
