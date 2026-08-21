"use client";

import { useBidForm } from "@/components/bid-form-context";
import { useBoard } from "@/components/board-context";
import { Button } from "@/components/ui/button";
import { formatDollars } from "@/lib/format";
import { TAKEOVER_HOURS } from "@/lib/ranking";

/** Buys every place on page one for a fixed window. */
export function TakeoverCard() {
  const { board } = useBoard();
  const { takeover, pending } = useBidForm();

  return (
    <section className="shadow-hard-sm overflow-hidden rounded-md border border-foreground">
      <h2 className="border-b border-foreground bg-primary px-3 py-2 text-[11px] font-bold tracking-[0.16em] text-primary-foreground uppercase">
        Front page
      </h2>
      <div className="p-3">
        <p className="text-2xl font-black tabular-nums">
          {formatDollars(board.takeoverPriceCents)}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-pretty text-muted-foreground">
          Hold every place on page one for {TAKEOVER_HOURS} hours — twice the standing top number.
          Nobody moves onto the page until it lapses.
        </p>
        <Button
          type="button"
          variant="chunkyOutline"
          size="sm"
          onClick={takeover}
          disabled={pending}
          className="mt-3 w-full"
        >
          Reserve the page
        </Button>
      </div>
    </section>
  );
}
