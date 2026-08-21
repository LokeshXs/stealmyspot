"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function remainingParts(endsAt: string, format: "full" | "compact") {
  const milliseconds = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const seconds = Math.ceil(milliseconds / 1_000);
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const parts = [hours, minutes, seconds % 60];
  const displayedParts = format === "compact" && hours === 0 ? parts.slice(1) : parts;
  return { seconds, text: displayedParts.map((part) => String(part).padStart(2, "0")).join(":") };
}

export function TakeoverCountdown({
  endsAt,
  format = "full",
  className,
}: {
  endsAt: string;
  format?: "full" | "compact";
  className?: string;
}) {
  const [remaining, setRemaining] = useState<{ seconds: number; text: string } | null>(null);

  useEffect(() => {
    const update = () => setRemaining(remainingParts(endsAt, format));
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [endsAt, format]);

  const accessible = remaining
    ? `Reservation ends in ${Math.floor(remaining.seconds / 3600)} hours and ${Math.floor((remaining.seconds % 3600) / 60)} minutes`
    : "Calculating reservation time remaining";

  return <time dateTime={endsAt} aria-label={accessible} className={cn("tabular-nums", className)}>{remaining?.text ?? "--:--:--"}</time>;
}
