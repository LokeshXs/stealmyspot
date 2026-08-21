import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { branding } from "@/lib/env";
import { cn } from "@/lib/utils";

/**
 * The mark carries the accent colour; the name stays ink. Both halves read from
 * env, so dropping in the real name is a one-line change.
 */
export function Wordmark({ className, size = "lg" }: { className?: string; size?: "sm" | "lg" }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2 font-black tracking-[-0.045em]",
        size === "lg" ? "text-2xl" : "text-xl",
        className,
      )}
    >
      <LogoMark
        className={cn(
          "text-foreground transition-transform group-hover:-translate-y-0.5",
          size === "lg" ? "size-6" : "size-5",
        )}
      />
      <span>
        {branding.name}
        <span className="text-muted-foreground">{branding.tld}</span>
      </span>
    </Link>
  );
}
