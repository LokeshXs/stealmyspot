"use client";

import { useEffect, useState } from "react";
import { UMAMI_SHARE_URL } from "@/lib/analytics";
import { usePresenceBaseline } from "@/components/presence-baseline-context";
import { addPresenceBaseline } from "@/lib/display-presence";
import { formatCount } from "@/lib/format";

/**
 * Readership badge for the masthead: a pill carrying the live count, the past
 * hour, and a way through to the public Umami dashboard. Server-renders with
 * real numbers, then polls so the count actually moves.
 *
 * The two trailing segments are hidden below `sm` — on a phone the pill has to
 * share a line with the wordmark, so only the live count earns its place.
 */
export function LivePill({
  initialOnline,
  initialLastHour,
}: {
  initialOnline: number;
  initialLastHour: number;
}) {
  const [counts, setCounts] = useState({ online: initialOnline, lastHour: initialLastHour });
  const baseline = usePresenceBaseline();
  const displayCounts = addPresenceBaseline(counts, baseline);

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
    <a
      href={UMAMI_SHARE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
    >
      <span className="relative inline-flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-70 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2 rounded-full bg-live" />
      </span>

      <span className="font-semibold text-live tabular-nums">
        {formatCount(displayCounts.online)} reading now
      </span>

      <span className="hidden tabular-nums sm:inline">
        · {formatCount(displayCounts.lastHour)} in the past hour
      </span>

      <span className="hidden text-foreground sm:inline">· see stats→</span>
    </a>
  );
}
