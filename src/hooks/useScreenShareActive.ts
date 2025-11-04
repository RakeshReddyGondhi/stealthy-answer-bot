import { useState, useEffect } from "react";

// Screensharing detection hook: returns TRUE when a custom 'screensharing' event is dispatched.
// To simulate: window.dispatchEvent(new CustomEvent('screensharing', { detail: { active: true } }));
// To revert:  window.dispatchEvent(new CustomEvent('screensharing', { detail: { active: false } }));

export function useScreenShareActive(): boolean {
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    function handler(e: any) {
      setIsScreenSharing(e?.detail?.active === true);
    }
    window.addEventListener("screensharing", handler);
    return () => window.removeEventListener("screensharing", handler);
  }, []);

  return isScreenSharing;
}
