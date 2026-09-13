import { cn } from "@/lib/utils";

function Block({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl border border-gold-line/30 bg-black/35", className)} />;
}

export function DeskSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading desk">
      <div className="space-y-2">
        <Block className="h-3 w-28" />
        <Block className="h-8 w-56" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Block className="h-28" />
        <Block className="h-28" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: compact ? 4 : 8 }).map((_, i) => (
          <Block key={i} className="h-20" />
        ))}
      </div>
      <Block className={compact ? "h-40" : "h-64"} />
    </div>
  );
}

export function MarketingSkeleton() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4" aria-busy="true" aria-label="Loading page">
      <div className="w-full max-w-xl space-y-4">
        <Block className="mx-auto h-3 w-40" />
        <Block className="mx-auto h-12 w-72" />
        <Block className="mx-auto h-4 w-full max-w-md" />
      </div>
    </div>
  );
}
