export {};

declare global {
  interface Window {
    overlayAPI: {
      show: (message: string) => void;
      hide: () => void;
      onUpdate?: (callback: (message: string) => void) => void; // optional
    };
  }
}
