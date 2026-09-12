"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { WalletConnectButton } from "@/components/desk/WalletConnectButton";

export function ProfileForm({
  name,
  email,
  phone,
  walletAddress,
  referralCode,
  emailVerified,
  verifyUrl,
  chainId,
}: {
  name: string;
  email: string;
  phone: string;
  walletAddress: string;
  referralCode: string;
  emailVerified: boolean;
  verifyUrl?: string | null;
  chainId?: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [address, setAddress] = useState(walletAddress);
  const [link, setLink] = useState(verifyUrl ?? "");
  const [verifyBusy, setVerifyBusy] = useState(false);

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
        phone: form.get("phone"),
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

  async function resendVerify() {
    setVerifyBusy(true);
    setError(null);
    const res = await fetch("/api/profile/verify-email", { method: "POST" });
    const data = await res.json();
    setVerifyBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not issue verification");
      return;
    }
    if (data.verifyUrl) setLink(data.verifyUrl);
    router.refresh();
  }

  return (
    <GlassCard>
      <form onSubmit={onSubmit} className="space-y-4">
        <WalletConnectButton targetChainId={chainId} onAddress={setAddress} />
        <label className="block text-sm">
          Full name
          <input name="name" defaultValue={name} required className="mt-1 w-full rounded-lg px-3 py-2" />
        </label>
        <label className="block text-sm">
          Email
          <input value={email} readOnly className="mt-1 w-full rounded-lg px-3 py-2 opacity-70" />
        </label>
        <div className="rounded-lg border border-gold-line/40 bg-black/30 px-3 py-3 text-sm">
          <p>
            Inbox status:{" "}
            <strong className={emailVerified ? "text-success" : "text-gold"}>
              {emailVerified ? "Verified" : "Unverified"}
            </strong>
          </p>
          {!emailVerified ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-muted">
                Local stub: request a token and open the link. No SMTP required.
              </p>
              {link ? (
                <p className="break-all font-mono text-[11px] text-gold">
                  <a href={link} className="hover:text-gold-bright">
                    {link}
                  </a>
                </p>
              ) : null}
              <GoldButton type="button" variant="ghost" disabled={verifyBusy} onClick={() => void resendVerify()}>
                {verifyBusy ? "Issuing…" : link ? "Refresh verification link" : "Send verification link"}
              </GoldButton>
            </div>
          ) : null}
        </div>
        <label className="block text-sm">
          Phone
          <input
            name="phone"
            defaultValue={phone}
            required
            placeholder="+15551234567"
            className="mt-1 w-full rounded-lg px-3 py-2"
          />
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
