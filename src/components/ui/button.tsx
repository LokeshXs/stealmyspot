import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md whitespace-nowrap border transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border-primary bg-primary font-medium text-primary-foreground hover:bg-primary/85 hover:border-primary/85",
        outline: "border-border bg-transparent text-foreground hover:border-foreground/40 hover:bg-muted/60",
        ghost: "border-transparent text-muted-foreground hover:text-foreground",
        /** Inline text action — used for the hover-revealed row action. */
        link: "h-auto border-none p-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        /** Square stepper, sized to sit flush against the amount field. */
        step: "size-9 text-base leading-none",
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
