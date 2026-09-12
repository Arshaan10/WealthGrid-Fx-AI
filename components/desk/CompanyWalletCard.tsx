import { Building2 } from "lucide-react";
import type { PublicChainConfig } from "@/lib/chain";
import { CopyText } from "@/components/desk/CopyText";

export function CompanyWalletCard({
  chain,
  title = "Company deposit address",
  body,
}: {
  chain: PublicChainConfig;
  title?: string;
  body?: string;
}) {
  return (
    <div className="rounded-xl border border-gold-line/60 bg-black/30 p-4">
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 text-gold" size={18} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-cream">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {body ??
              `Send USDT (BEP-20 / ERC-20) on ${chain.chainName} (chain ${chain.chainId}) to the company hot wallet. The admin treasury is a separate DB float — both must be funded.`}
          </p>
          {chain.companyWalletAddress ? (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <code className="break-all font-mono text-xs text-gold-bright">
                  {chain.companyWalletAddress}
                </code>
                <CopyText value={chain.companyWalletAddress} />
              </div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                Token {chain.usdtContractAddress ?? "USDT contract not set"} · {chain.usdtDecimals}{" "}
                decimals
              </p>
              <a
                href={`${chain.explorerUrl}/address/${chain.companyWalletAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-gold hover:text-gold-bright"
              >
                Open on explorer →
              </a>
            </div>
          ) : (
            <p className="mt-3 text-xs text-danger">
              COMPANY_WALLET_ADDRESS is not configured. You can still record a deposit intent and
              transaction hash for admin confirmation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
