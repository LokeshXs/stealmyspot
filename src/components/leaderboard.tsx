"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ListingRow } from "@/components/listing-row";
import { Pagination } from "@/components/pagination";
import { useBoard } from "@/components/board-context";
import { formatDollars } from "@/lib/format";
import { MIN_BID_CENTS, TAKEOVER_HOURS } from "@/lib/ranking";

/** The ledger: hairline-divided rows on the page, no card, no shadow. */
export function Leaderboard() {
  const { board, refresh } = useBoard();
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
          The ledger
        </h2>
        {board.total > 0 ? (
          <p className="text-[11px] font-medium text-muted-foreground tabular-nums">
            {board.rangeStart}–{board.rangeEnd} of {board.total}
          </p>
        ) : null}
      </div>

      {board.takeoverEndsAt ? (
        <p className="mb-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-pretty sm:px-4">
          <span className="font-bold text-primary">Page one is held.</span> Reserved for{" "}
          {TAKEOVER_HOURS} hours — new entries join from page two until it lapses.
        </p>
      ) : null}

      {board.entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-[--rule] border-y border-[--rule]">
          <AnimatePresence initial={false}>
            {board.entries.map((entry) => (
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
        onPageChange={refresh}
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
