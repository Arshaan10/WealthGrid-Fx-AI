import type { PublicChainConfig } from "@/lib/chain";

export function Bep20Banner({ chain }: { chain: PublicChainConfig }) {
  return (
    <div className="rounded-xl border border-gold-line/50 bg-black/35 px-4 py-3 text-xs leading-relaxed text-muted">
      <p className="font-semibold uppercase tracking-[0.16em] text-gold/80">Network lock</p>
      <p className="mt-1 text-cream">
        {chain.networkLabel}. Other chains and tokens are rejected — no ERC-20, TRC-20, or native
        BNB.
      </p>
      <p className="mt-1">
        Connect any Web3 / DEX wallet. Deposits send USDT BEP-20 to the company address. Withdrawals
        pay USDT BEP-20 to your connected address after treasury cover.
      </p>
    </div>
  );
}
