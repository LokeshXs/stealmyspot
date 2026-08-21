"use client";

import { RollingNumber } from "@/components/rolling-number";
import { Avatar } from "@/components/ui/avatar";
import type { BoardEntry } from "@/lib/board";
import { formatCount, formatDollars, timeAgo } from "@/lib/format";
import { initialFor } from "@/lib/identity";
import { INCREMENT_CENTS } from "@/lib/ranking";
import { cn } from "@/lib/utils";

/**
 * Fire-and-forget click tracking. The anchor keeps its real href so the status
 * bar shows the true destination and navigation is never delayed by us.
 */
function trackClick(id: string) {
  const body = JSON.stringify({ id });
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/click", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/click", { method: "POST", body, keepalive: true }).catch(() => {});
}

/** The top three read as a podium; everything below is a plain tile. */
const PODIUM = ["bg-rank-1 text-primary", "bg-rank-2 text-primary", "bg-rank-3 text-primary"];

export function ListingRow({ entry }: { entry: BoardEntry }) {
  const isLeader = entry.rank === 1;
  const podium = PODIUM[entry.rank - 1];
  const nextPrice = formatDollars(entry.amountCents + INCREMENT_CENTS);

  return (
    <article className={cn("group relative", isLeader && "bg-primary/[0.05]")}>
      {/* The leader is marked in the margin rather than by boxing the row. */}
      {isLeader ? (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-[--accent-bar]" />
      ) : null}

      <a
        href={entry.sourceUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => trackClick(entry.id)}
        onAuxClick={() => trackClick(entry.id)}
        className="flex items-center gap-3 py-3.5 pr-2 pl-3 transition-colors hover:bg-muted/50 sm:gap-4 sm:pl-5"
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-black tabular-nums sm:size-11 sm:text-base",
            podium ?? "bg-muted text-muted-foreground",
          )}
        >
          {String(entry.rank).padStart(2, "0")}
        </span>

        <Avatar
          src={entry.imageUrl}
          alt=""
          fallback={initialFor(entry.label)}
          className="size-9 rounded-md sm:size-11"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold sm:text-base">{entry.label}</p>
            {isLeader ? (
              <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-black tracking-[0.1em] text-primary-foreground uppercase">
                Leader
              </span>
            ) : null}
          </div>

          {entry.description ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.description}</p>
          ) : null}

          <p className="mt-1 text-[11px] font-medium text-muted-foreground/70 tabular-nums">
            {formatCount(entry.clickCount)} clicks
            <span aria-hidden="true" className="px-1.5">
              ·
            </span>
            <time dateTime={entry.rankedAt}>{timeAgo(entry.rankedAt)}</time>
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={cn(
              "text-base font-black tabular-nums sm:text-lg",
              isLeader ? "text-primary" : "text-foreground",
            )}
          >
            <RollingNumber value={entry.amountCents / 100} />
          </span>
          {/* Revealed on hover so a resting row stays a clean ledger line. */}
          <span className="shadow-hard-sm rounded-md border border-foreground bg-card px-2 py-0.5 text-[10px] font-bold whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-sm:hidden">
            take this place · {nextPrice}
          </span>
        </div>
      </a>
    </article>
  );
}
