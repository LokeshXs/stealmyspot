import Link from "next/link";
import { branding } from "@/lib/env";

export function SiteFooter() {
  return (
    <footer className="rule-t mt-12 flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-[11px] font-medium text-muted-foreground">
      <span>
        {branding.name}
        {branding.tld}
      </span>
      <Link href="/rules" className="transition-colors hover:text-foreground">
        Rules
      </Link>
      <Link href="/stats" className="transition-colors hover:text-foreground">
        Figures
      </Link>
      <span className="ml-auto">Positions are bought, not earned.</span>
    </footer>
  );
}
