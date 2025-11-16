import { contextBridge } from "electron";

// Queue for calls before overlayAPI is ready
const overlayQueue: { type: "show" | "hide"; message?: string }[] = [];

// Temporary placeholder on window
window.overlayAPI = {
  show: (message: string) => {
    overlayQueue.push({ type: "show", message });
  },
  hide: () => {
    overlayQueue.push({ type: "hide" });
  },
};

// Actual implementation
const actualOverlayAPI: Window["overlayAPI"] = {
  show: (message: string) => {
    console.log("Overlay show:", message);
    // Send IPC to main process if needed
  },
  hide: () => {
    console.log("Overlay hide");
  },
};

// Replace placeholder with actual API
setTimeout(() => {
  window.overlayAPI = actualOverlayAPI;

  // Flush queued calls
  overlayQueue.forEach((call) => {
    if (call.type === "show") actualOverlayAPI.show(call.message!);
    else actualOverlayAPI.hide();
  });

  overlayQueue.length = 0; // Clear queue
}, 0);

// Expose API to renderer
contextBridge.exposeInMainWorld("overlayAPI", window.overlayAPI);
