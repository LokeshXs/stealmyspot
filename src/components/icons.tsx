import { cn } from "@/lib/utils";

type IconProps = React.ComponentProps<"svg">;

/** Three stacked bars — a short one on top, rising to a full-width base. */
export function LogoMark({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 36 28" fill="none" aria-hidden="true" className={cn("h-7 w-auto", className)} {...props}>
      <rect x="22" y="0" width="14" height="6" rx="3" className="fill-primary" />
      <rect x="12" y="11" width="24" height="6" rx="3" className="fill-foreground" />
      <rect x="0" y="22" width="36" height="6" rx="3" className="fill-foreground" />
    </svg>
  );
}

export function ChevronLeft({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn("size-4", className)} {...props}>
      <path d="M15 6C15 6 9 10.4189 9 12C9 13.5812 15 18 15 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

export function ChevronRight({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn("size-4", className)} {...props}>
      <path d="M9 6C9 6 15 10.4189 15 12C15 13.5812 9 18 9 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

export function Spinner({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn("size-3.5 animate-spin", className)} {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.75" />
      <path d="M20 12A8 8 0 0 0 12 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" />
    </svg>
  );
}

export function GlobeIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn("size-3.5", className)} {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="4" ry="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 12H22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

export function SunIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn("size-3.5", className)} {...props}>
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export function MoonIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn("size-3.5", className)} {...props}>
      <path d="M21 13.2A9 9 0 1 1 10.8 3a7 7 0 0 0 10.2 10.2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}
