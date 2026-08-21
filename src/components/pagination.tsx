"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { formatCount } from "@/lib/format";

/** Bottom-of-page navigation: a range readout on the left, arrows on the right. */
export function Pagination({
  page,
  pageCount,
  rangeStart,
  rangeEnd,
  total,
  rangeLabel,
}: {
  page: number;
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  rangeLabel?: string;
}) {
  return (
    <nav
      aria-label="Ledger pages"
      className="rule-t flex items-center justify-between gap-4 py-3 text-[11px] font-medium text-muted-foreground"
    >
      <p className="tabular-nums">
        {rangeLabel ?? (total === 0
          ? "no entries"
          : `${formatCount(rangeStart)}–${formatCount(rangeEnd)} of ${formatCount(total)}`)}
      </p>

      {pageCount > 1 ? (
        <div className="flex items-center gap-3">
          <Link
            href={`/?page=${page - 1}`}
            scroll={false}
            aria-label="Previous page"
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            className="p-1 transition-colors hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-30"
          >
            <ChevronLeft />
          </Link>
          <span className="tabular-nums">
            Page {page} of {pageCount}
          </span>
          <Link
            href={`/?page=${page + 1}`}
            scroll={false}
            aria-label="Next page"
            aria-disabled={page >= pageCount}
            tabIndex={page >= pageCount ? -1 : undefined}
            className="p-1 transition-colors hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-30"
          >
            <ChevronRight />
          </Link>
        </div>
      ) : null}
    </nav>
  );
}
