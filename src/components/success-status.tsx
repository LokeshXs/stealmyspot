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
        <p className="text-5xl font-bold tracking-[-0.03em] text-primary tabular-nums">
          {rank ? `#${rank}` : "You're on"}
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-[-0.02em]">You&apos;re on the board.</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
          Your {formatDollars(amountCents)} bid is live. Someone can outbid you for{" "}
          {formatDollars(amountCents + 100)} — you&apos;ll only pay the difference to take it back.
        </p>
      </div>
    );
  }

  if (status === "FAILED" || status === "EXPIRED") {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em]">Payment didn&apos;t go through.</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
          Nothing was charged and no rank was claimed. Try again whenever you like.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        {!timedOut ? <Spinner className="size-4" /> : null}
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground">
          {timedOut ? "Still confirming…" : "Confirming payment…"}
        </h1>
      </div>
      <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
        {timedOut
          ? "This is taking longer than usual. Your rank appears as soon as the payment confirmation arrives — no need to pay again."
          : "Your rank goes live the moment the payment clears. This usually takes a second or two."}
      </p>
    </div>
  );
}
