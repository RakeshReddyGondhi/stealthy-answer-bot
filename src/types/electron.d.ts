interface ElectronAPI {
  send: (channel: string, ...args: unknown[]) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}