import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-[12px] border border-[var(--border)] bg-white px-4 py-2 text-[16px] tracking-[0.18px] ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/50 focus-visible:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:ring-offset-zinc-900",
          className
        )}
        {...props}
      />
    );
  }
);
Select.displayName = "Select";

export { Select };
