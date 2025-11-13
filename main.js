import { fileURLToPath } from 'url';
import path from 'path';
import { app, BrowserWindow, ipcMain, screen } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let overlayWindow;

// Determine if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  // Get primary display info
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // ===== MAIN WINDOW (Visible UI for User) =====
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    x: Math.floor((screenWidth - 1200) / 2),
    y: Math.floor((screenHeight - 800) / 2),
    show: false,
    skipTaskbar: false, // SHOW in taskbar
    backgroundColor: '#ffffff', // White background
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: isDev
    },
    frame: true, // Show normal window frame
    transparent: false, // NOT transparent
    alwaysOnTop: false,
    icon: path.join(__dirname, 'public', 'icon.png')
  });

  // ===== OVERLAY WINDOW (Answer Display) =====
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 300,
    x: screenWidth - 420,
    y: screenHeight - 320,
    transparent: true,
    frame: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: { 
      nodeIntegration: true, 
      contextIsolation: false,
      devTools: isDev
    },
    focusable: false, // Make overlay window click-through by default
    hasShadow: false,
    show: false
  });

  // Determine correct paths
  const indexPath = isDev
    ? path.join(__dirname, 'dist', 'index.html')
    : path.join(process.resourcesPath, 'dist', 'index.html');
  
  const overlayPath = isDev
    ? path.join(__dirname, 'dist', 'overlay.html')
    : path.join(process.resourcesPath, 'dist', 'overlay.html');

  // Load main window
  mainWindow.loadURL(`file://${indexPath}`)
    .then(() => {
      console.log('Main window loaded');
      mainWindow.show();
      if (isDev) {
        mainWindow.webContents.openDevTools();
      }
    })
    .catch((err) => {
      console.error('Failed to load main window:', err);
      const { dialog } = require('electron');
      dialog.showErrorBox('Load Error', `Failed to load: ${err.message}`);
    });

  // Load overlay window with click-through always enabled
  overlayWindow.loadURL(`file://${overlayPath}`)
    .then(() => {
      console.log('Overlay loaded');
      // Overlay click-through by default
      overlayWindow.setIgnoreMouseEvents(true, { forward: true });
      if (isDev) {
        overlayWindow.show();
      }
    })
    .catch((err) => {
      console.error('Overlay load failed:', err);
    });

  // IPC: Show answer (overlay always click-through for background app use)
  ipcMain.on('show-overlay-answer', (_, answer) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      console.log('Showing answer:', answer);
      overlayWindow.webContents.send('show-answer', answer);
      overlayWindow.show();
      overlayWindow.setIgnoreMouseEvents(true, { forward: true }); // Overlay always click-through
      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.hide();
          overlayWindow.setIgnoreMouseEvents(true, { forward: true }); // Restores click-through
        }
      }, 10000);
    }
  });

  // IPC: Hide overlay
  ipcMain.on('hide-overlay', () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.hide();
    }
  });

  // Window close handling
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.close();
    }
    overlayWindow = null;
  });

  // Error handling
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Main window failed to load:', errorCode, errorDescription);
  });

  overlayWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Overlay failed to load:', errorCode, errorDescription);
  });
}

// App lifecycle
app.on('ready', () => {
  console.log('App is ready');
  console.log('App path:', app.getAppPath());
  console.log('Is packaged:', app.isPackaged);
  createWindow();
});

app.on('window-all-closed', () => {
  ipcMain.removeAllListeners('show-overlay-answer');
  ipcMain.removeAllListeners('hide-overlay');
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
