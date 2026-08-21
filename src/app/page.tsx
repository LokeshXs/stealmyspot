import { BoardProvider } from "@/components/board-context";
import { BoardShell } from "@/components/board-shell";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getBoardPage, getStats } from "@/lib/board";

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
        <BoardShell volumeCents={stats.volumeCents} />
      </BoardProvider>
      <SiteFooter />
    </main>
  );
}
