import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { app, BrowserWindow } from 'electron';

// __dirname workaround for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: __dirname + '/public/icon.png'
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
