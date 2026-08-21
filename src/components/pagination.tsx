"use client";

import { ChevronLeft, ChevronRight } from "@/components/icons";
import { formatCount } from "@/lib/format";

/** Bottom-of-page navigation: a range readout on the left, arrows on the right. */
export function Pagination({
  page,
  pageCount,
  rangeStart,
  rangeEnd,
  total,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav
      aria-label="Ledger pages"
      className="rule-t flex items-center justify-between gap-4 py-3 text-[11px] font-medium text-muted-foreground"
    >
      <p className="tabular-nums">
        {total === 0
          ? "no entries"
          : `${formatCount(rangeStart)}–${formatCount(rangeEnd)} of ${formatCount(total)}`}
      </p>

      {pageCount > 1 ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="cursor-pointer p-1 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft />
          </button>
          <span className="tabular-nums">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="cursor-pointer p-1 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight />
          </button>
        </div>
      ) : null}
    </nav>
  );
}
