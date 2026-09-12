"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { SectionHeading } from "@/components/brand/SectionHeading";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      password: form.get("password"),
      referralCode: form.get("referralCode"),
    };
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setBusy(false);
      setError(data.error ?? "Could not register");
      return;
    }
    if (data.verifyUrl) setVerifyUrl(data.verifyUrl);
    const login = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    setBusy(false);
    if (login?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard/profile");
    router.refresh();
  }

  return (
    <GlassCard>
      <SectionHeading kicker="Onboarding" title="Open a desk account" />
      <p className="mt-3 text-sm text-muted">
        One identity only: unique email and unique phone. Verify the inbox before depositing.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          Full name
          <input name="name" required className="mt-1 w-full rounded-lg px-3 py-2" />
        </label>
        <label className="block text-sm">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded-lg px-3 py-2" />
        </label>
        <label className="block text-sm">
          Phone
          <input
            name="phone"
            required
            placeholder="+15551234567"
            className="mt-1 w-full rounded-lg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-lg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Referral code <span className="text-muted">(optional)</span>
          <input
            name="referralCode"
            placeholder="WG-DEMO01"
            className="mt-1 w-full rounded-lg px-3 py-2"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {verifyUrl ? (
          <p className="break-all font-mono text-[11px] text-gold">
            Verify inbox: <a href={verifyUrl}>{verifyUrl}</a>
          </p>
        ) : null}
        <GoldButton type="submit" disabled={busy} className="w-full">
          {busy ? "Opening…" : "Create account"}
        </GoldButton>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already on the desk?{" "}
        <Link href="/login" className="text-gold hover:text-gold-bright">
          Login
        </Link>
      </p>
      <RiskDisclaimer compact className="mt-6" />
    </GlassCard>
  );
}
