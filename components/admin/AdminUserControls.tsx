"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";

export function AdminUserControls({
  userId,
  blocked,
  walletAddress,
  self,
}: {
  userId: string;
  blocked: boolean;
  walletAddress: string;
  self: boolean;
}) {
  const router = useRouter();
  const [address, setAddress] = useState(walletAddress);
  const [isBlocked, setIsBlocked] = useState(blocked);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function patch(payload: { blocked?: boolean; walletAddress?: string }) {
    setBusy(true);
    setError(null);
    setOk(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, ...payload }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    if (typeof data.blocked === "boolean") setIsBlocked(data.blocked);
    if (typeof data.walletAddress === "string" || data.walletAddress === null) {
      setAddress(data.walletAddress ?? "");
    }
    setOk("Saved.");
    router.refresh();
  }

  async function onWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await patch({ walletAddress: address });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <GlassCard>
        <h3 className="font-display text-xl">Access</h3>
        <p className="mt-2 text-sm text-muted">
          Blocked members cannot login, deposit, or withdraw.
        </p>
        <p className="mt-3 text-sm">
          Status:{" "}
          <strong className={isBlocked ? "text-danger" : "text-success"}>
            {isBlocked ? "Blocked" : "Active"}
          </strong>
        </p>
        {self ? (
          <p className="mt-3 text-xs text-muted">You cannot block your own admin account.</p>
        ) : (
          <GoldButton
            type="button"
            className="mt-4"
            disabled={busy}
            onClick={() => void patch({ blocked: !isBlocked })}
          >
            {busy ? "Updating…" : isBlocked ? "Unblock user" : "Block user"}
          </GoldButton>
        )}
      </GlassCard>
      <GlassCard>
        <h3 className="font-display text-xl">Withdrawal wallet</h3>
        <form onSubmit={onWallet} className="mt-3 space-y-3">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x… BEP-20 payout address"
            className="w-full rounded-lg px-3 py-2 font-mono text-sm"
          />
          <GoldButton type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save wallet"}
          </GoldButton>
        </form>
      </GlassCard>
      {error ? <p className="text-sm text-danger md:col-span-2">{error}</p> : null}
      {ok ? <p className="text-sm text-success md:col-span-2">{ok}</p> : null}
    </div>
  );
}
