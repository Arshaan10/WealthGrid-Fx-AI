import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { ProfileForm } from "@/components/desk/ProfileForm";
import { getChainId } from "@/lib/chain";
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
          Connect a wallet to save your payout destination. Withdrawals use this address and you
          can still edit it by hand.
        </p>
      </GlassCard>
      <ProfileForm
        name={user?.name ?? ""}
        email={user?.email ?? ""}
        walletAddress={user?.walletAddress ?? ""}
        referralCode={user?.referralCode ?? ""}
        chainId={getChainId()}
      />
      <RiskDisclaimer compact />
    </div>
  );
}
