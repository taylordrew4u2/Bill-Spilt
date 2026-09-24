import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The large title at the top of every signed-in screen (the iOS "large
 * title" pattern): tells you where you are at a glance, with room on the
 * right for one page-level action.
 */
export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-base text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
