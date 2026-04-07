import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-[16px] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[0px_0px_1px_rgba(0,0,0,0.32),0px_0px_2px_rgba(0,0,0,0.08),0px_1px_3px_rgba(45,127,249,0.28)] dark:shadow-none dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-50", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-[24px] font-medium leading-[1.25] tracking-[0.12px]", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-[14px] text-[var(--muted-soft)] tracking-[0.07px] dark:text-zinc-400", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
