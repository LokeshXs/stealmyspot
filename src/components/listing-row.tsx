"use client";

import { Avatar } from "@/components/ui/avatar";
import type { BoardEntry } from "@/lib/board";
import { formatCount, formatDollars, timeAgo } from "@/lib/format";
import { initialFor } from "@/lib/identity";
import { INCREMENT_CENTS } from "@/lib/ranking";
import { cn } from "@/lib/utils";

/**
 * Fire-and-forget click tracking. The anchor keeps its real href so the status
 * bar shows the true destination and the navigation is never delayed by us.
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
  const isTop = entry.rank === 1;
  const claimPrice = formatDollars(entry.amountCents + INCREMENT_CENTS);

  return (
    <div
      className={cn(
        "group relative -mx-2 my-1.5 rounded-lg px-1.5 md:-mx-3 md:my-3 md:rounded-xl md:px-2.5",
        isTop && "border-2 border-primary bg-primary/12",
      )}
    >
      <a
        href={entry.sourceUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => trackClick(entry.id)}
        onAuxClick={() => trackClick(entry.id)}
        className="flex items-center gap-2 py-3 transition-colors hover:text-primary md:gap-3 md:py-5"
      >
        <span
          className={cn(
            "inline-flex min-w-7 shrink-0 items-center justify-center rounded-full px-1.5 py-px text-xs font-semibold md:min-w-10 md:px-2 md:py-0.5 md:text-base",
            isTop ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          #{entry.rank}
        </span>

        <Avatar
          src={entry.imageUrl}
          alt=""
          fallback={initialFor(entry.label)}
          className="size-7 md:size-14"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold md:text-base">{entry.label}</p>
          {entry.description ? (
            <p className="line-clamp-3 min-w-0 text-xs font-medium text-ellipsis text-muted-foreground md:text-base">
              {entry.description}
            </p>
          ) : null}
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] md:text-xs">
            <span className="text-muted-foreground/70">
              <time dateTime={entry.rankedAt}>{timeAgo(entry.rankedAt)}</time>
            </span>
            <span className="text-muted-foreground/70">·</span>
            <span className="font-semibold text-foreground">
              {formatCount(entry.clickCount)} clicks
            </span>
            <span className="text-muted-foreground/70">·</span>
            <span className="font-bold text-primary tabular-nums">
              {formatDollars(entry.amountCents)}
            </span>
            <span className="text-muted-foreground/70">·</span>
            <span className="text-muted-foreground/70">claim this rank for {claimPrice}</span>
          </p>
        </div>
      </a>
    </div>
  );
}
