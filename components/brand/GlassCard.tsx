import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div className={cn("glass-card min-w-0 rounded-2xl", pad && "p-6 sm:p-8", className)}>
      {children}
    </div>
  );
}
