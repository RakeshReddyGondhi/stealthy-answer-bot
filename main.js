import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let overlayWindow = null;

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    x: Math.round((width - 1200) / 2),
    y: Math.round((height - 800) / 2),
    show: false,
    backgroundColor: "#ffffff",
    icon: isDev
      ? path.join(__dirname, "public/icon.png")
      : path.join(process.resourcesPath, "dist/icon.png"),    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(process.resourcesPath, "dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createOverlayWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 400,
    height: 250,
    x: width - 420,
    y: height - 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preloadOverlay.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  });

  overlayWindow.setContentProtection(true); // prevents screen capture

  if (isDev) {
    overlayWindow.loadURL(process.env.VITE_DEV_SERVER_URL + "/overlay.html");
  } else {
    overlayWindow.loadFile(
      path.join(process.resourcesPath, "dist/overlay.html")
    );
  }

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
}

app.whenReady().then(() => {
  createMainWindow();
  createOverlayWindow();
});

// IPC from React → Electron
ipcMain.on("overlay:show", (_, text) => {
  overlayWindow.webContents.send("overlay:update", text);
  overlayWindow.showInactive(); // show without taking focus
});

ipcMain.on("overlay:hide", () => {
  overlayWindow.hide();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (!mainWindow) createMainWindow();
});
