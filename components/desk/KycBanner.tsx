import Link from "next/link";

export function KycBanner({ gaps }: { gaps: string[] }) {
  if (gaps.length === 0) return null;
  return (
    <div className="mb-6 rounded-lg border border-gold-line/60 bg-gold-dim px-4 py-3 text-sm text-cream">
      Complete your identity to deposit or withdraw: <strong>{gaps.join(", ")}</strong>.{" "}
      <Link href="/dashboard/profile" className="text-gold hover:text-gold-bright">
        Open profile →
      </Link>
    </div>
  );
}
