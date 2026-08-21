import Link from "next/link";
import { LivePill } from "@/components/live-pill";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { getPresenceCounts } from "@/lib/presence";

/**
 * Left-aligned masthead with a heavy rule beneath it — the page reads as a
 * printed listing, not a landing page.
 */
export async function SiteHeader() {
  const { online, lastHour } = await getPresenceCounts();

  return (
    <header className="rule-masthead flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-3">
      <h1>
        <Wordmark />
      </h1>

      <div className="flex items-center gap-4 text-xs">
        <LivePill initialOnline={online} initialLastHour={lastHour} />
        <span aria-hidden="true" className="text-rule">
          |
        </span>
        <Link href="/rules" className="text-muted-foreground transition-colors hover:text-foreground">
          Rules
        </Link>
        <Link href="/stats" className="text-muted-foreground transition-colors hover:text-foreground">
          Figures
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
