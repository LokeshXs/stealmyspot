"use client";

import { useEffect, useState } from "react";
import { formatCount } from "@/lib/format";

/**
 * Inline readership indicator for the masthead. Server-renders with real counts,
 * then polls so the figure actually moves.
 */
export function LivePill({
  initialOnline,
  initialLastHour,
}: {
  initialOnline: number;
  initialLastHour: number;
}) {
  const [counts, setCounts] = useState({ online: initialOnline, lastHour: initialLastHour });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/presence", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { online: number; lastHour: number };
        if (!cancelled) setCounts(data);
      } catch {
        // A dropped poll is not worth surfacing.
      }
    }

    const timer = setInterval(poll, 20_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground"
      title={`${formatCount(counts.lastHour)} in the past hour`}
    >
      <span className="relative inline-flex size-1.5 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-70 motion-reduce:animate-none" />
        <span className="relative inline-flex size-1.5 rounded-full bg-live" />
      </span>
      <span className="tabular-nums">{formatCount(counts.online)}</span>
      <span>reading now</span>
    </span>
  );
}
