"use client";

import { useEffect } from "react";

// Registers public/sw.js so phones can install Amble as an app. Production only,
// so dev servers never pick up a worker.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
