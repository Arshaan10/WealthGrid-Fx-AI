import { cn } from "@/lib/utils";

export function SectionHeading({
  kicker,
  title,
  lede,
  align = "left",
}: {
  kicker?: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn(align === "center" && "mx-auto max-w-2xl text-center")}>
      {kicker ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-gold">
          {kicker}
        </p>
      ) : null}
      <h2 className="font-display text-3xl text-cream sm:text-4xl">{title}</h2>
      {lede ? <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{lede}</p> : null}
    </div>
  );
}
