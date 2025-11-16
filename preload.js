import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  showOverlay: (text) => ipcRenderer.send("overlay:show", text),
  hideOverlay: () => ipcRenderer.send("overlay:hide"),
});
