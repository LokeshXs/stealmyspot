"use client";

import { ChevronLeft, ChevronRight } from "@/components/icons";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageCount,
  onPageChange,
  label,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label: string;
}) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav aria-label={label} className="flex items-center">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex size-6 cursor-pointer items-center justify-center text-primary transition-colors hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-muted-foreground/40"
        >
          <ChevronLeft />
        </button>

        {pages.map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
            onClick={() => onPageChange(n)}
            className={cn(
              "flex h-6 min-w-6 cursor-pointer items-center justify-center rounded-full px-1 text-xs font-medium tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              n === page
                ? "bg-primary text-primary-foreground"
                : "text-primary hover:bg-primary/10",
            )}
          >
            {n}
          </button>
        ))}

        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="flex size-6 cursor-pointer items-center justify-center text-primary transition-colors hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-muted-foreground/40"
        >
          <ChevronRight />
        </button>
      </div>
    </nav>
  );
}
