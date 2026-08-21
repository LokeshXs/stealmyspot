"use client";

import { useEffect } from "react";

const HEARTBEAT_MS = 30_000;
const STORAGE_KEY = "outbid.session";

/** Heartbeats a per-tab session id so the live counter has something to count. */
export function PresenceTracker() {
  useEffect(() => {
    let sessionId: string;
    try {
      sessionId = sessionStorage.getItem(STORAGE_KEY) ?? crypto.randomUUID();
      sessionStorage.setItem(STORAGE_KEY, sessionId);
    } catch {
      // Private mode or storage disabled — still count this visit for the session.
      sessionId = crypto.randomUUID();
    }

    const beat = () => {
      void fetch("/api/presence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId }),
        keepalive: true,
      }).catch(() => {});
    };

    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, []);

  return null;
}
