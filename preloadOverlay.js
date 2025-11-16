import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("overlayAPI", {
  onUpdate: (callback) =>
    ipcRenderer.on("overlay:update", (_, text) => callback(text)),
});
