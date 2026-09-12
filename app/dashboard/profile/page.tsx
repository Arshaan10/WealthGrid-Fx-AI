import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { ProfileForm } from "@/components/desk/ProfileForm";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">Profile</h2>
        <p className="mt-2 text-sm text-muted">
          Wallet address is stored for the future DEX payout rail. It is not
          connected on-chain in Phase 1.
        </p>
      </GlassCard>
      <ProfileForm
        name={user?.name ?? ""}
        email={user?.email ?? ""}
        walletAddress={user?.walletAddress ?? ""}
        referralCode={user?.referralCode ?? ""}
      />
      <RiskDisclaimer compact />
    </div>
  );
}
