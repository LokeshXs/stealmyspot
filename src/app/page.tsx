import { Leaderboard } from "@/components/leaderboard";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getBoardPage } from "@/lib/board";

// The board is live data — never serve it from a cache.
export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const raw = Array.isArray(params.page) ? params.page[0] : params.page;
  const board = await getBoardPage(Number.parseInt(raw ?? "1", 10) || 1);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pt-6 pb-16">
      <SiteHeader />
      <Leaderboard initialBoard={board} />
      <SiteFooter />
    </main>
  );
}
