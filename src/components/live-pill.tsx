"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCount } from "@/lib/format";

/**
 * "N visitors online · N in the last hour · see stats→".
 * Server-renders with real counts, then polls so the number actually moves.
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
    <Link
      href="/stats"
      className="inline-block max-w-full rounded-full bg-muted px-3 py-1.5 text-center text-sm text-balance text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className="relative inline-flex size-2 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-live" />
        </span>
        <span className="font-semibold text-live">
          {formatCount(counts.online)} {counts.online === 1 ? "visitor" : "visitors"} online
        </span>
      </span>
      <span> · {formatCount(counts.lastHour)} in the last hour</span>
      <span className="text-foreground"> · see stats→</span>
    </Link>
  );
}
