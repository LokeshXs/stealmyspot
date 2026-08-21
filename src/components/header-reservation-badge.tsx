"use client";

import { useBoard } from "@/components/board-context";
import { TakeoverCountdown } from "@/components/takeover-countdown";
import { Avatar } from "@/components/ui/avatar";
import { initialFor } from "@/lib/identity";

/** Compact masthead status for the currently reserved page-one holder. */
export function HeaderReservationBadge() {
  const { board } = useBoard();
  const takeover = board.takeover;

  if (!takeover) return null;

  return (
    <a
      href="#page-one-reservation"
      className="group flex min-h-11 min-w-0 items-center border-2 border-foreground bg-card shadow-[3px_3px_0_var(--foreground)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary max-sm:order-3 max-sm:w-full"
    >
      <span className="sr-only">Page one reserved by {takeover.label}. View reservation.</span>
      <Avatar
        src={takeover.imageUrl}
        alt=""
        fallback={initialFor(takeover.label)}
        className="ml-1.5 size-8 shrink-0 rounded-none border border-foreground"
      />
      <span className="min-w-0 flex-1 truncate px-2.5 text-xs font-black sm:max-w-36">
        {takeover.label}
      </span>
      <span className="self-stretch border-l-2 border-foreground bg-primary/10 px-2.5 py-2.5 text-[0.58rem] font-black tracking-[0.13em] text-primary uppercase">
        Reserved
      </span>
      <TakeoverCountdown
        endsAt={takeover.endsAt}
        format="compact"
        className="min-w-[4.5rem] px-2.5 text-center text-xs font-black text-foreground"
      />
    </a>
  );
}
