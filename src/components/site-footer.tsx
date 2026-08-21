import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteFooter() {
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-muted-foreground">
      <Link href="/rules" className="transition-colors hover:text-foreground">
        Rules
      </Link>
      <span aria-hidden="true">·</span>
      <Link href="/stats" className="transition-colors hover:text-foreground">
        Live stats
      </Link>
      <span aria-hidden="true">·</span>
      <ThemeToggle />
    </footer>
  );
}
