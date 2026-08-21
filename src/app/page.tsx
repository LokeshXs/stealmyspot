import { BoardProvider } from "@/components/board-context";
import { BidComposer } from "@/components/bid-composer";
import { Dateline } from "@/components/dateline";
import { Leaderboard } from "@/components/leaderboard";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getBoardPage, getStats } from "@/lib/board";
import { branding } from "@/lib/env";

// The board is live data — never serve it from a cache.
export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const raw = Array.isArray(params.page) ? params.page[0] : params.page;

  const [board, stats] = await Promise.all([
    getBoardPage(Number.parseInt(raw ?? "1", 10) || 1),
    getStats(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-6 pb-12 sm:px-6">
      <SiteHeader />

      <BoardProvider initialBoard={board}>
        <Dateline volumeCents={stats.volumeCents} />

        <p className="max-w-2xl py-8 font-display text-2xl leading-[1.3] text-pretty sm:text-3xl">
          {branding.tagline}{" "}
          <span className="text-muted-foreground italic">{branding.taglineEmphasis}</span>
        </p>

        {/*
          The composer comes first in source order so a phone shows it above the
          ledger — a single-column grid follows the DOM. From `lg` up, `order`
          swings it into the right-hand rail without moving it in the markup.
        */}
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_320px] lg:gap-10">
          <aside className="lg:order-2 lg:sticky lg:top-6">
            <BidComposer />
          </aside>
          <div className="lg:order-1">
            <Leaderboard />
          </div>
        </div>
      </BoardProvider>

      <SiteFooter />
    </main>
  );
}
