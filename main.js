import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { app, BrowserWindow } from 'electron';
import fetch from 'node-fetch';
import os from 'os';
import WebSocket from 'ws';

// __dirname workaround for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const adminUrl = 'https://admin.mycompany.com/api/permit';
function getClientId() {
  // Unique identifier, e.g., machine MAC address, hostname, or generated UUID per device
  return os.hostname(); // Replace with your own logic if needed
}
async function checkAdminPermission() {
  try {
    const res = await fetch(adminUrl, { method: 'POST', body: JSON.stringify({ id: getClientId() }), headers: { 'Content-Type': 'application/json' } });
    if (res.status !== 200) return false;
    const { allowed } = await res.json();
    return allowed === true;
  } catch (e) {
    console.error("Admin check error:", e);
    return false;
  }
}
let ws;
function initWebSocketForAdmin() {
  ws = new WebSocket('wss://admin.mycompany.com/socket');
  ws.on('message', msg => {
    if (msg === 'DENY') {
      app.quit();
    }
  });
}
let win;
async function startApp() {
  // Step 1: Ask for admin permission
  let allowed = await checkAdminPermission();
  if (!allowed) return app.quit();
  // Step 2: Create hidden background window
  win = new BrowserWindow({
    skipTaskbar: true,
    show: false,
    webPreferences: { nodeIntegration: true }
  });
  // Step 3: Load your React index.html or dev URL
  win.loadURL('file://' + __dirname + '/dist/index.html');
  // Step 4: Continuous admin permission check every 1 minute (60 seconds)
  // If permission is revoked, immediately force quit the app
  setInterval(async () => {
    let stillAllowed = await checkAdminPermission();
    if (!stillAllowed) {
      win.close();
      app.quit(); // Force quit immediately when admin revokes permission
    }
  }, 60000); // Check every 60000ms = 1 minute
  // Step 5: Hide window even when ready
  win.once('ready-to-show', () => win.hide());
  // Step 6: Enable WebSocket-based instant disable
  initWebSocketForAdmin();
}
// Start the app
app.on('ready', startApp);
