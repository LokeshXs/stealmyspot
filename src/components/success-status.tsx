"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/icons";
import { formatDollars } from "@/lib/format";

type Status = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

const POLL_MS = 2_000;
const GIVE_UP_AFTER_MS = 60_000;

export function SuccessStatus({
  bidId,
  initialStatus,
  initialRank,
  amountCents,
}: {
  bidId: string;
  initialStatus: Status;
  initialRank: number | null;
  amountCents: number;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [rank, setRank] = useState<number | null>(initialRank);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (status !== "PENDING") return;

    const startedAt = Date.now();
    let cancelled = false;

    const timer = setInterval(async () => {
      if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
        if (!cancelled) setTimedOut(true);
        clearInterval(timer);
        return;
      }
      try {
        const res = await fetch(`/api/bids/${bidId}/status`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { status: Status; rank: number | null };
        if (cancelled) return;
        setStatus(data.status);
        setRank(data.rank);
      } catch {
        // Keep polling; a single dropped request means nothing.
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [bidId, status]);

  if (status === "PAID") {
    return (
      <div>
        <p className="font-mono text-6xl text-primary tabular-nums">
          {rank ? String(rank).padStart(2, "0") : "—"}
        </p>
        <h1 className="mt-4 font-display text-3xl">
          {rank ? `Entered at #${rank}.` : "Entered."}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">
          Your number stands at{" "}
          <span className="font-mono text-foreground">{formatDollars(amountCents)}</span>. The next
          person along pays {formatDollars(amountCents + 100)} to pass you — and you only pay the
          gap to take it back.
        </p>
      </div>
    );
  }

  if (status === "FAILED" || status === "EXPIRED") {
    return (
      <div>
        <h1 className="font-display text-3xl">Nothing went through.</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">
          You were not charged and no position changed hands. Start again whenever you like.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        {!timedOut ? <Spinner className="size-4" /> : null}
        <h1 className="font-display text-3xl text-foreground">
          {timedOut ? "Still settling" : "Settling"}
        </h1>
      </div>
      <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
        {timedOut
          ? "Longer than usual. Your place appears the moment the confirmation reaches us — there is no need to pay a second time."
          : "Your place is entered as soon as the payment clears. Usually a second or two."}
      </p>
    </div>
  );
}
