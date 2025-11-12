import { useState, useEffect } from "react";

// Screensharing detection hook: returns TRUE when a custom 'screensharing' event is dispatched.
// To simulate: window.dispatchEvent(new CustomEvent('screensharing', { detail: { active: true } }));
// To revert:  window.dispatchEvent(new CustomEvent('screensharing', { detail: { active: false } }));

export function useScreenShareActive(): boolean {
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      // The custom event is expected to be a CustomEvent with a detail shape { active?: boolean }
      const ev = e as CustomEvent<{ active?: boolean }>;
      setIsScreenSharing(ev?.detail?.active === true);
    }
    window.addEventListener("screensharing", handler as EventListener);
    return () => window.removeEventListener("screensharing", handler as EventListener);
  }, []);

  return isScreenSharing;
}
