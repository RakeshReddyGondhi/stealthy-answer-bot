import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { app, BrowserWindow, ipcMain, screen } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let mainWindow;
let overlayWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,    show: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    frame: false,
    transparent: true,
    icon: `${__dirname}/public/icon.png`
  });

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;

  overlayWindow = new BrowserWindow({
    width, height, x: 0, y: 0,
    transparent: true, frame: false,
    skipTaskbar: true, alwaysOnTop: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
    type: 'toolbar', focusable: false, hasShadow: false,
  });

  overlayWindow.loadURL(`file://${__dirname}/dist/overlay.html`);
  overlayWindow.setIgnoreMouseEvents(true);
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  setInterval(() => {
    if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.moveTop();
  }, 1000);

  ipcMain.on('show-overlay-answer', (_, answer) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('show-answer', answer);
    }
  });

  mainWindow.loadURL(`file://${__dirname}/dist/index.html`);
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (overlayWindow) overlayWindow.close();
    overlayWindow = null;
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });
