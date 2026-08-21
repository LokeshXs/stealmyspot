"use client";

import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@/components/icons";

/**
 * Both icons render and the `dark:` variant picks one, so there is no mounted
 * flag and nothing to hydrate-mismatch — the class on <html> already has the answer.
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
