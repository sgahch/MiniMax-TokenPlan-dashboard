import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[96px] w-full rounded-[12px] border border-[var(--border)] bg-white px-4 py-3 text-[16px] tracking-[0.18px] ring-offset-white placeholder:text-[var(--muted-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/50 focus-visible:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:ring-offset-zinc-900 dark:placeholder:text-zinc-500",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
