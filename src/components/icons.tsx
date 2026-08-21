import { cn } from "@/lib/utils";

type IconProps = React.ComponentProps<"svg">;

/**
 * An ascending caret held between two brackets — a rank glyph, not a bar chart.
 * The brackets carry the ledger idea; the caret is the only accented element.
 */
export function LogoMark({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-7", className)}
      {...props}
    >
      <path
        d="M9 4H4v24h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        opacity="0.55"
      />
      <path
        d="M23 4h5v24h-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        opacity="0.55"
      />
      <path d="M16 9l7 12H9l7-12Z" className="fill-primary" />
    </svg>
  );
}

export function ChevronLeft({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={cn("size-3.5", className)} {...props}>
      <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function ChevronRight({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={cn("size-3.5", className)} {...props}>
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

/** Points at the rank a pending bid would land on. */
export function ArrowRight({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={cn("size-3.5", className)} {...props}>
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function Spinner({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={cn("size-3 animate-spin", className)} {...props}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M14 8A6 6 0 0 0 8 2" stroke="currentColor" strokeLinecap="square" strokeWidth="1.5" />
    </svg>
  );
}

/** Refresh glyph for the dateline. */
export function Recycle({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={cn("size-3", className)} {...props}>
      <path
        d="M13.5 8a5.5 5.5 0 1 1-1.7-3.97"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
      <path d="M13.5 2v3.2h-3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function GlobeIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={cn("size-3.5", className)} {...props}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <ellipse cx="8" cy="8" rx="2.6" ry="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 8h12" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function SunIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={cn("size-3.5", className)} {...props}>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1v1.6M8 13.4V15M2.05 2.05l1.13 1.13M12.82 12.82l1.13 1.13M1 8h1.6M13.4 8H15M2.05 13.95l1.13-1.13M12.82 3.18l1.13-1.13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function MoonIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={cn("size-3.5", className)} {...props}>
      <path
        d="M14 8.8A6.4 6.4 0 1 1 7.2 2a5 5 0 0 0 6.8 6.8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
