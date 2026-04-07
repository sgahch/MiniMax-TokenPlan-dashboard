import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[12px] text-[16px] leading-[1.3] tracking-[0.08px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/50 focus-visible:border-[var(--brand)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--brand)] text-white hover:bg-[#154ca0] shadow-[0px_1px_3px_rgba(45,127,249,0.28)] dark:shadow-none",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        outline: "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--surface-muted)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
        secondary: "bg-[var(--surface-muted)] text-[var(--foreground)] hover:bg-[var(--border)] dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
      },
      size: {
        default: "h-[48px] px-6 py-3",
        sm: "h-[36px] px-4 text-[14px]",
        lg: "h-[56px] px-8 text-[18px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
