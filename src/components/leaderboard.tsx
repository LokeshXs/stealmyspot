"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ListingRow } from "@/components/listing-row";
import { TakeoverDeed } from "@/components/takeover-deed";
import { Pagination } from "@/components/pagination";
import { useBoard } from "@/components/board-context";
import { formatDollars } from "@/lib/format";
import { MIN_BID_CENTS } from "@/lib/ranking";

/** The ledger: hairline-divided rows on the page, no card, no shadow. */
export function Leaderboard() {
  const { board } = useBoard();
  const reduceMotion = useReducedMotion();
  const holder = board.page === 1 ? board.entries.find((entry) => entry.takeoverState === "HOLDER") : null;
  const ordinaryEntries = holder ? board.entries.filter((entry) => entry.id !== holder.id) : board.entries;
  const queuedStart = (board.page - 2) * 50 + 1;
  const paginationLabel = board.takeover
    ? board.page === 1
      ? `${board.takeover.occupiedCount} occupied · ${50 - board.takeover.occupiedCount} open`
      : `${queuedStart}–${queuedStart + board.entries.length - 1} of ${board.takeover.queuedCount} queued`
    : undefined;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
          The ledger
        </h2>
        {board.total > 0 ? (
          <p className="text-[11px] font-medium text-muted-foreground tabular-nums">{board.takeover ? (board.page === 1 ? `${board.takeover.occupiedCount} occupied · ${50 - board.takeover.occupiedCount} open` : `${board.takeover.queuedCount} waiting ${board.takeover.queuedCount === 1 ? "entry" : "entries"}`) : `${board.rangeStart}–${board.rangeEnd} of ${board.total}`}</p>
        ) : null}
      </div>

      {holder && board.takeover ? <TakeoverDeed entry={holder} takeover={board.takeover} /> : null}
      {holder && ordinaryEntries.length > 0 ? <div className="mt-5 flex items-center justify-between border-b-2 border-foreground pb-2"><p className="text-[0.65rem] font-black tracking-[0.17em] uppercase">Frozen positions</p><span className="text-[0.6rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">Locked until expiry</span></div> : null}
      {board.takeover && board.page > 1 ? <div className="mb-3 border-2 border-foreground bg-primary/10 px-4 py-3"><p className="text-xs font-black tracking-[0.15em] uppercase">Awaiting page-one reopening</p><p className="mt-1 text-xs text-muted-foreground">These products will be ranked normally when the reservation ends.</p></div> : null}

      {board.entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={holder ? "divide-y divide-[--rule] border-b border-[--rule]" : "divide-y divide-[--rule] border-y border-[--rule]"}>
          <AnimatePresence initial={false}>
            {ordinaryEntries.map((entry) => (
              <motion.div
                key={entry.id}
                layout={reduceMotion ? false : "position"}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 340, damping: 34 }}
              >
                <ListingRow entry={entry} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Pagination
        page={board.page}
        pageCount={board.pageCount}
        rangeStart={board.rangeStart}
        rangeEnd={board.rangeEnd}
        total={board.total}
        rangeLabel={paginationLabel}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-dashed border-[--rule] px-4 py-14 text-center">
      <p className="text-2xl font-black tracking-[-0.02em]">Nothing here yet.</p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-pretty text-muted-foreground">
        The first entry sets the floor at{" "}
        <span className="font-bold text-primary">{formatDollars(MIN_BID_CENTS)}</span>. Put a number
        in above and it is yours.
      </p>
    </div>
  );
}
