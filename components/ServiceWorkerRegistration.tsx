"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        // Each page load checks for a new version. The worker's message handler
        // lets an update UI activate it immediately in the future.
        await registration.update();
      } catch {
        // Offline support is progressive enhancement.
      }
    };
    void register();
  }, []);

  return null;
}
