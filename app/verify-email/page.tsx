import type { Metadata } from "next";
import Link from "next/link";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldLink } from "@/components/brand/GoldButton";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { consumeEmailToken } from "@/lib/email-verify";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token
    ? await consumeEmailToken(token)
    : { ok: false as const, reason: "Missing verification token." };

  return (
    <MarketingShell>
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <GlassCard>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">Identity</p>
          <h1 className="mt-2 font-display text-3xl">
            {result.ok ? "Inbox verified" : "Verification failed"}
          </h1>
          <p className="mt-3 text-sm text-muted">
            {result.ok
              ? `${result.email} is marked verified. You can deposit and withdraw.`
              : result.reason}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <GoldLink href="/dashboard/profile">Profile</GoldLink>
            <Link href="/login" className="text-sm text-gold hover:text-gold-bright">
              Login
            </Link>
          </div>
        </GlassCard>
      </div>
    </MarketingShell>
  );
}
