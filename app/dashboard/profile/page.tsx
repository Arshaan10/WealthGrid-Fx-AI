import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { ProfileForm } from "@/components/desk/ProfileForm";
import { ProfileIdentity } from "@/components/desk/ProfileIdentity";
import { rankBySlug } from "@/config/rewards";
import { getPublicChainConfig } from "@/lib/chain";
import { verifyUrlForToken } from "@/lib/email-verify";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatUsd } from "@/lib/utils";

export default async function ProfilePage() {
  const session = await requireUser();
  const chain = getPublicChainConfig();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { rankProgress: true },
  });
  const rank = rankBySlug(user?.rankProgress?.currentRank ?? "none");

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">Profile</h2>
        <p className="mt-2 text-sm text-muted">
          Required identity: full name, unique phone, and a verified inbox. Connect any Web3 / DEX
          wallet to bond your USDT BEP-20 payout destination on {chain.chainName}.
        </p>
      </GlassCard>
      <ProfileIdentity
        name={user?.name ?? ""}
        email={user?.email ?? ""}
        referralCode={user?.referralCode ?? ""}
        walletAddress={user?.walletAddress ?? ""}
        rankName={rank.name}
        personalVolume={formatUsd(user?.rankProgress?.personalVolume ?? 0)}
        teamVolume={formatUsd(user?.rankProgress?.teamVolume ?? 0)}
        chain={chain}
      />
      <ProfileForm
        name={user?.name ?? ""}
        email={user?.email ?? ""}
        phone={user?.phone ?? ""}
        walletAddress={user?.walletAddress ?? ""}
        referralCode={user?.referralCode ?? ""}
        emailVerified={Boolean(user?.emailVerified)}
        verifyUrl={user?.emailVerifyToken ? verifyUrlForToken(user.emailVerifyToken) : null}
        chainId={chain.chainId}
      />
      <RiskDisclaimer compact />
    </div>
  );
}
