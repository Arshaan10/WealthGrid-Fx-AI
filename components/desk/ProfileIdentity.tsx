import { CopyText } from "@/components/desk/CopyText";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldLink } from "@/components/brand/GoldButton";
import { shortAddress } from "@/lib/address";
import type { PublicChainConfig } from "@/lib/chain";

export function ProfileIdentity({
  name,
  email,
  referralCode,
  walletAddress,
  rankName,
  personalVolume,
  teamVolume,
  chain,
}: {
  name: string;
  email: string;
  referralCode: string;
  walletAddress: string;
  rankName: string;
  personalVolume: string;
  teamVolume: string;
  chain: PublicChainConfig;
}) {
  const bonded = Boolean(walletAddress);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <GlassCard className="p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Member</p>
        <h3 className="mt-2 font-display text-3xl">{name}</h3>
        <p className="mt-1 text-sm text-muted">{email}</p>
        <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-muted">Referral code</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="font-mono text-lg text-gold-bright">{referralCode}</p>
          <CopyText value={referralCode} label="Copy" />
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">User address</p>
        <p className="mt-3 font-mono text-lg text-cream">
          {walletAddress ? shortAddress(walletAddress, 8, 6) : "Not connected"}
        </p>
        {walletAddress ? (
          <div className="mt-3">
            <CopyText value={walletAddress} label="Copy address" />
          </div>
        ) : null}
        <p className="mt-4 flex items-center gap-2 text-xs">
          <span className={`h-2 w-2 rounded-full ${bonded ? "bg-success" : "bg-muted"}`} />
          <span className="text-muted">
            {bonded
              ? `On-chain bonded · ${chain.chainName}`
              : `Connect a wallet to bond on ${chain.chainName}`}
          </span>
        </p>
        <p className="mt-2 font-mono text-[11px] text-gold-bright">{referralCode}</p>
      </GlassCard>

      <GlassCard className="p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Current rank</p>
        <h3 className="mt-2 font-display text-3xl gold-text">{rankName}</h3>
        <p className="mt-3 text-xs text-muted">Personal {personalVolume}</p>
        <p className="text-xs text-muted">Team {teamVolume}</p>
        <GoldLink href="/dashboard/rewards" variant="ghost" className="mt-4 px-3 py-1.5 text-xs">
          Rank details
        </GoldLink>
      </GlassCard>
    </div>
  );
}
