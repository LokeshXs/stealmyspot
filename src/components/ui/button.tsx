import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md whitespace-nowrap border font-medium transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border-primary bg-primary text-primary-foreground hover:bg-primary/85 hover:border-primary/85",
        /**
         * Sits on a solid offset shadow that collapses on press, so the button
         * physically drops into the page. Used for every primary call to action.
         */
        chunky:
          "shadow-hard border-foreground bg-primary font-bold text-primary-foreground hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        chunkyOutline:
          "shadow-hard-sm border-foreground bg-card font-bold text-foreground hover:-translate-x-px hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        outline: "border-border bg-transparent text-foreground hover:border-foreground/40 hover:bg-muted/60",
        ghost: "border-transparent text-muted-foreground hover:text-foreground",
        link: "h-auto border-none p-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 px-2 text-[11px]",
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-14 px-7 text-base",
        /** Square stepper, sized to sit flush against an amount field. */
        step: "size-11 text-lg leading-none",
        stepLg: "size-14 text-2xl leading-none sm:size-16",
        none: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
