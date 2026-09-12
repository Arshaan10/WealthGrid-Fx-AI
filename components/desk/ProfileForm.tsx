"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { WalletConnectButton } from "@/components/desk/WalletConnectButton";

export function ProfileForm({
  name,
  email,
  walletAddress,
  referralCode,
  chainId,
}: {
  name: string;
  email: string;
  walletAddress: string;
  referralCode: string;
  chainId?: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [address, setAddress] = useState(walletAddress);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setOk(false);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        walletAddress: address,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save");
      return;
    }
    setOk(true);
    router.refresh();
  }

  return (
    <GlassCard>
      <form onSubmit={onSubmit} className="space-y-4">
        <WalletConnectButton targetChainId={chainId} onAddress={setAddress} />
        <label className="block text-sm">
          Name
          <input name="name" defaultValue={name} required className="mt-1 w-full rounded-lg px-3 py-2" />
        </label>
        <label className="block text-sm">
          Email
          <input value={email} readOnly className="mt-1 w-full rounded-lg px-3 py-2 opacity-70" />
        </label>
        <label className="block text-sm">
          Referral code
          <input value={referralCode} readOnly className="mt-1 w-full rounded-lg px-3 py-2 opacity-70" />
        </label>
        <label className="block text-sm">
          Wallet address
          <input
            name="walletAddress"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x… payout destination"
            className="mt-1 w-full rounded-lg px-3 py-2"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {ok ? <p className="text-sm text-success">Profile saved.</p> : null}
        <GoldButton type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save profile"}
        </GoldButton>
      </form>
    </GlassCard>
  );
}
