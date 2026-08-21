import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { branding } from "@/lib/env";
import { cn } from "@/lib/utils";

export function Wordmark({ className, size = "lg" }: { className?: string; size?: "sm" | "lg" }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium tracking-[-0.04em]",
        size === "lg" ? "text-[36px]" : "text-2xl",
        className,
      )}
    >
      <LogoMark className={size === "lg" ? "h-7" : "h-5"} />
      <span>
        {branding.name}
        <span className="text-primary">{branding.tld.slice(0, 1)}</span>
        {branding.tld.slice(1)}
      </span>
    </Link>
  );
}
