import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[5px] text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[var(--sidebar-royal-deep)] active:translate-y-px",
        navigation: "text-navy-muted hover:text-primary-foreground hover:bg-navy-border",
        destructive: "bg-[#dc2626] text-white hover:bg-[#b91c1c] active:translate-y-px",
        outline:
          "border-[1.5px] border-primary/85 bg-background text-primary hover:bg-accent hover:border-primary hover:text-[var(--sidebar-royal-deep)] active:translate-y-px",
        secondary:
          "border border-[#d1d5db] bg-[#f8fafc] text-[#1f2937] hover:bg-[#e5e7eb] hover:text-[#111827] active:translate-y-px",
        ghost: "text-foreground hover:bg-accent hover:text-primary",
        link: "text-primary font-medium underline decoration-[1.5px] underline-offset-4 hover:text-[var(--sidebar-royal-deep)]",
      },
      size: {
        default: "h-9 rounded-[5px] px-4 py-2",
        sm: "h-8 rounded-[5px] px-3 text-sm",
        lg: "h-10 rounded-[5px] px-7 text-sm",
        icon: "h-9 w-9 rounded-[5px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
