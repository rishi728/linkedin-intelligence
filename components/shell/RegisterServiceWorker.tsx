"use client";

import { useEffect } from "react";

/** Lets the app open and run offline after the first visit. Only in production, where sw.js exists. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is a bonus; the app works the same without it.
    });
  }, []);
  return null;
}
