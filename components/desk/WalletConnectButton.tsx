"use client";

import { Wallet } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { GoldButton } from "@/components/brand/GoldButton";
import { shortAddress } from "@/lib/address";

export function WalletConnectButton({
  persist = true,
  targetChainId,
  onAddress,
}: {
  persist?: boolean;
  targetChainId?: number;
  onAddress?: (address: string) => void;
}) {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [persistError, setPersistError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const onAddressRef = useRef(onAddress);
  onAddressRef.current = onAddress;

  const uniqueConnectors = useMemo(() => {
    const seen = new Set<string>();
    return connectors.filter((connector) => {
      const key = `${connector.id}:${connector.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [connectors]);

  useEffect(() => {
    if (!address) {
      setSaved(false);
      return;
    }
    onAddressRef.current?.(address);
    if (!persist) return;
    let cancelled = false;
    setPersistError(null);
    void fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setPersistError(data.error ?? "Could not save wallet to your profile.");
          return;
        }
        setSaved(true);
      })
      .catch(() => {
        if (!cancelled) setPersistError("Could not save wallet to your profile.");
      });
    return () => {
      cancelled = true;
    };
  }, [address, persist]);

  const onDeskChain = Boolean(isConnected && targetChainId && chainId === targetChainId);
  const wrongChain = Boolean(isConnected && targetChainId && chainId && chainId !== targetChainId);
  const hasWalletConnect = uniqueConnectors.some((connector) => connector.id === "walletConnect");

  return (
    <div className="rounded-xl border border-dashed border-gold-line bg-black/30 p-4">
      <div className="flex items-start gap-3">
        <Wallet className="mt-0.5 text-gold" size={18} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-cream">
            {isConnected ? "Web3 wallet connected" : "Connect any Web3 / DEX wallet"}
          </p>
          {isConnected && address ? (
            <>
              <p className="mt-1 font-mono text-xs text-gold-bright">{shortAddress(address)}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {saved
                  ? "Saved on your profile as the USDT BEP-20 payout destination."
                  : "Connected. Saving this address to your profile…"}
              </p>
              {wrongChain ? (
                <GoldButton
                  type="button"
                  variant="ghost"
                  className="mt-3"
                  disabled={switching}
                  onClick={() => targetChainId && switchChain({ chainId: targetChainId })}
                >
                  {switching ? "Switching…" : "Switch to BNB Smart Chain (BEP-20)"}
                </GoldButton>
              ) : onDeskChain ? (
                <p className="mt-2 text-xs text-success">On BNB Smart Chain · USDT BEP-20 only</p>
              ) : null}
              <GoldButton type="button" variant="ghost" className="mt-3" onClick={() => disconnect()}>
                Disconnect
              </GoldButton>
            </>
          ) : (
            <>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Any injected browser wallet or WalletConnect mobile/DEX wallet works — MetaMask,
                Trust, TokenPocket, SafePal, Binance Web3, Rabby, Coinbase, and other EIP-1193
                wallets. Deposits and payouts are <strong className="text-cream">USDT BEP-20</strong>{" "}
                on BNB Smart Chain only.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {uniqueConnectors.map((connector) => (
                  <GoldButton
                    key={connector.uid}
                    type="button"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() =>
                      connect({
                        connector,
                        chainId: targetChainId,
                      })
                    }
                  >
                    {isPending ? "Connecting…" : connectorName(connector.name, connector.id)}
                  </GoldButton>
                ))}
              </div>
              {!hasWalletConnect ? (
                <p className="mt-2 text-[11px] text-muted">
                  Set WALLETCONNECT_PROJECT_ID to unlock QR connect for mobile DEX wallets.
                  Injected browser wallets still work.
                </p>
              ) : null}
            </>
          )}
          {error ? <p className="mt-2 text-xs text-danger">{error.message}</p> : null}
          {persistError ? <p className="mt-2 text-xs text-danger">{persistError}</p> : null}
        </div>
      </div>
    </div>
  );
}

function connectorName(name: string, id: string) {
  if (id === "walletConnect") return "WalletConnect (any DEX / mobile)";
  if (id === "injected" && name.toLowerCase() === "injected") return "Browser Web3 wallet";
  return name;
}
