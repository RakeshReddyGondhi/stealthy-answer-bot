interface ElectronAPI {
  send: (channel: string, ...args: any[]) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}