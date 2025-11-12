import { fileURLToPath } from 'url';
import path from 'path';
import { app, BrowserWindow, ipcMain, screen } from 'electron';

const __filename = fileURLToPath(import.meta.url);
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
        icon: path.join(app.getAppPath(), 'public/icon.png')
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

    const overlayPath = path.join(app.getAppPath(), 'dist/overlay.html');
    overlayWindow.loadURL(`file://${overlayPath}`);
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

    const indexPath = path.join(app.getAppPath(), 'dist/index.html');
    mainWindow.loadURL(`file://${indexPath}`);
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (overlayWindow) overlayWindow.close();
    overlayWindow = null;
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });
