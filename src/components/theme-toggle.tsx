"use client";

import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@/components/icons";

/**
 * Both icons are always rendered and swapped by the `dark:` variant, so there is
 * no mounted flag and nothing to hydrate-mismatch — the class on <html> already
 * carries the answer before React runs.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
    >
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </button>
  );
}
