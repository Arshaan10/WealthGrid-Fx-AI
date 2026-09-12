"use client";

import { Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

  const wrongChain = Boolean(isConnected && targetChainId && chainId && chainId !== targetChainId);

  return (
    <div className="rounded-xl border border-dashed border-gold-line bg-black/30 p-4">
      <div className="flex items-start gap-3">
        <Wallet className="mt-0.5 text-gold" size={18} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-cream">
            {isConnected ? "Wallet connected" : "Connect wallet"}
          </p>
          {isConnected && address ? (
            <>
              <p className="mt-1 font-mono text-xs text-gold-bright">{shortAddress(address)}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {saved
                  ? "Saved on your profile as the payout destination. You can still edit it."
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
                  {switching ? "Switching…" : "Switch to the desk chain"}
                </GoldButton>
              ) : null}
              <GoldButton type="button" variant="ghost" className="mt-3" onClick={() => disconnect()}>
                Disconnect
              </GoldButton>
            </>
          ) : (
            <>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Injected browser wallet (MetaMask and similar) or WalletConnect. The connected
                address is stored on your profile and used as the withdrawal destination.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {connectors.map((connector) => (
                  <GoldButton
                    key={connector.uid}
                    type="button"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => connect({ connector })}
                  >
                    {isPending ? "Connecting…" : connector.name}
                  </GoldButton>
                ))}
              </div>
            </>
          )}
          {error ? <p className="mt-2 text-xs text-danger">{error.message}</p> : null}
          {persistError ? <p className="mt-2 text-xs text-danger">{persistError}</p> : null}
        </div>
      </div>
    </div>
  );
}
