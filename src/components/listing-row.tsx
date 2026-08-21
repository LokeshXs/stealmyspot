"use client";

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

export function ListingRow({ entry }: { entry: BoardEntry }) {
  const isLeader = entry.rank === 1;
  const nextPrice = formatDollars(entry.amountCents + INCREMENT_CENTS);

  return (
    <article className={cn("group relative", isLeader && "bg-primary/[0.04]")}>
      {/* The leader is marked by a rule in the margin, not by boxing the row. */}
      {isLeader ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[3px] bg-[--accent-bar]"
        />
      ) : null}

      <a
        href={entry.sourceUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => trackClick(entry.id)}
        onAuxClick={() => trackClick(entry.id)}
        className="flex items-baseline gap-3 py-3.5 pr-1 pl-3 transition-colors hover:bg-muted/40 sm:gap-4 sm:pl-5"
      >
        <span
          className={cn(
            "w-7 shrink-0 self-center font-mono text-sm tabular-nums sm:w-9 sm:text-base",
            isLeader ? "text-primary" : "text-muted-foreground/60",
          )}
        >
          {String(entry.rank).padStart(2, "0")}
        </span>

        <Avatar
          src={entry.imageUrl}
          alt=""
          fallback={initialFor(entry.label)}
          className="size-8 self-center rounded-sm sm:size-9"
        />

        <div className="min-w-0 flex-1 self-center">
          <div className="flex items-baseline gap-2">
            <p className="truncate text-sm font-medium text-foreground">{entry.label}</p>
            {isLeader ? (
              <span className="shrink-0 font-mono text-[10px] tracking-[0.12em] text-primary uppercase">
                Leader
              </span>
            ) : null}
          </div>

          {entry.description ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.description}</p>
          ) : null}

          <p className="mt-1 font-mono text-[11px] text-muted-foreground/70 tabular-nums">
            {formatCount(entry.clickCount)} clicks
            <span aria-hidden="true" className="px-1.5">
              ·
            </span>
            <time dateTime={entry.rankedAt}>{timeAgo(entry.rankedAt)}</time>
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 self-center">
          <span
            className={cn(
              "font-mono text-sm tabular-nums sm:text-base",
              isLeader ? "font-medium text-primary" : "text-foreground",
            )}
          >
            {formatDollars(entry.amountCents)}
          </span>
          {/* Revealed on hover so the resting row stays a clean ledger line. */}
          <span className="font-mono text-[10px] whitespace-nowrap text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-sm:hidden">
            take this place · {nextPrice}
          </span>
        </div>
      </a>
    </article>
  );
}
