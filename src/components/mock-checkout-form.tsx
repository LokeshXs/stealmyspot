"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatDollars } from "@/lib/format";

export function MockCheckoutForm({ bidId, amountCents }: { bidId: string; amountCents: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/mock/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bidId }),
      });
      if (!res.ok) {
        setError("Payment could not be completed.");
        setPending(false);
        return;
      }
      router.push(`/success?bid=${bidId}`);
    } catch {
      setError("Payment could not be completed.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={pay} disabled={pending} className="w-full">
        {pending ? "Processing…" : `Pay ${formatDollars(amountCents)}`}
      </Button>
      {error ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
