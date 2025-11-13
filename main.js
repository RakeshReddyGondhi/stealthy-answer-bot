// Entry for Electron main process: wires in AI handler and overlay
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import './src/aiAnswerHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
global.overlayWindow = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    x: Math.floor((screenWidth - 1200) / 2),
    y: Math.floor((screenHeight - 800) / 2),
    show: false,
    skipTaskbar: false,
    backgroundColor: '#ffffff',
    webPreferences: { nodeIntegration: true, contextIsolation: false, devTools: isDev },
    frame: true,
    transparent: false,
    alwaysOnTop: false,
    icon: path.join(__dirname, 'public', 'icon.png')
  });

  global.overlayWindow = new BrowserWindow({
    width: 400,
    height: 300,
    x: screenWidth - 420,
    y: screenHeight - 320,
    transparent: true,
    frame: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false, devTools: isDev },
    focusable: false,
    hasShadow: false,
    show: false
  });

  const indexPath = isDev
    ? path.join(__dirname, 'dist', 'index.html')
    : path.join(process.resourcesPath, 'dist', 'index.html');
  const overlayPath = isDev
    ? path.join(__dirname, 'dist', 'overlay.html')
    : path.join(process.resourcesPath, 'dist', 'overlay.html');

  mainWindow.loadURL(`file://${indexPath}`).then(() => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });

  global.overlayWindow.loadURL(`file://${overlayPath}`).then(() => {
    global.overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    if (isDev) global.overlayWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (global.overlayWindow && !global.overlayWindow.isDestroyed()) {
      global.overlayWindow.close();
    }
    global.overlayWindow = null;
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  ipcMain.removeAllListeners('show-overlay-answer');
  ipcMain.removeAllListeners('hide-overlay');
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (!mainWindow) createWindow();
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
