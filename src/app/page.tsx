import { BoardProvider } from "@/components/board-context";
import { BoardShell } from "@/components/board-shell";
import { PresenceBaselineProvider } from "@/components/presence-baseline-context";
import { PresenceTracker } from "@/components/presence-tracker";
import { SeoContent } from "@/components/seo-content";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getBoardPage, getStats } from "@/lib/board";
import { createPresenceBaseline } from "@/lib/display-presence";
import { homeStructuredData, serializeJsonLd } from "@/lib/seo";

// The board is live data — never serve it from a cache.
export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const raw = Array.isArray(params.page) ? params.page[0] : params.page;

  const [board, stats] = await Promise.all([
    getBoardPage(Number.parseInt(raw ?? "1", 10) || 1),
    getStats(),
  ]);
  const presenceBaseline = createPresenceBaseline();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homeStructuredData()) }}
      />
      <PresenceBaselineProvider initialBaseline={presenceBaseline}>
        {/* StickyBidBar is fixed to the viewport, so the footer needs extra clearance. */}
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-6 pb-24 sm:px-6">
          <BoardProvider initialBoard={board}>
            <SiteHeader />
            <BoardShell volumeCents={stats.volumeCents} />
          </BoardProvider>
          <SeoContent />
          <SiteFooter />
        </main>
        <PresenceTracker />
      </PresenceBaselineProvider>
    </>
  );
}
