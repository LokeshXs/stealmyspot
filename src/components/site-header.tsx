import { LivePill } from "@/components/live-pill";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { getPresenceCounts } from "@/lib/presence";

/**
 * Left-aligned masthead with a heavy rule beneath it. Navigation lives in the
 * footer; the compact card preview is the one product action in the masthead.
 */
export async function SiteHeader() {
  const { online, lastHour } = await getPresenceCounts();

  return (
    <header className="rule-masthead flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pb-3">
      <Wordmark />



      <div className="flex min-w-0 items-center gap-3 max-sm:ml-auto">
        <LivePill initialOnline={online} initialLastHour={lastHour} />
        <ThemeToggle />
      </div>
    </header>
  );
}
