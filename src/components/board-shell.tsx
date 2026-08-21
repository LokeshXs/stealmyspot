"use client";

import { useEffect, useRef, useState } from "react";
import { BidFormProvider } from "@/components/bid-form-context";
import { BidHero } from "@/components/bid-hero";
import { Dateline } from "@/components/dateline";
import { HowItWorks } from "@/components/how-it-works";
import { Leaderboard } from "@/components/leaderboard";
import { StickyBidBar } from "@/components/sticky-bid-bar";
import { TakeoverCard } from "@/components/takeover-card";

/**
 * Owns the one piece of state the server can't: whether the hero is still on
 * screen. Everything below the hero is arranged around that answer.
 */
export function BoardShell({ volumeCents }: { volumeCents: number }) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [heroOffScreen, setHeroOffScreen] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only show the bar when the hero has scrolled UP out of view — not when
        // the page first paints and the sentinel is still below the fold.
        setHeroOffScreen(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { rootMargin: "0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <BidFormProvider>
      <Dateline volumeCents={volumeCents} />
      <BidHero sentinelRef={sentinelRef} />

      {/*
        `min-w-0` on both columns is load-bearing: a grid item defaults to
        `min-width: auto`, so the truncated (white-space: nowrap) listing
        descriptions would otherwise size the track to their full unwrapped
        width and push the page into horizontal scroll on a phone.
      */}
      <div className="grid items-start gap-8 pb-16 lg:grid-cols-[1fr_300px] lg:gap-10">
        <aside className="flex min-w-0 flex-col gap-3 lg:order-2 lg:sticky lg:top-6">
          <TakeoverCard />
          <HowItWorks />
        </aside>
        <div className="min-w-0 lg:order-1">
          <Leaderboard />
        </div>
      </div>

      <StickyBidBar visible={heroOffScreen} />
    </BidFormProvider>
  );
}
