"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { SectionHeading } from "@/components/brand/SectionHeading";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(
    params.get("blocked") === "1" ? "This account is blocked. Contact support." : null,
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setBusy(false);
    if (result?.error) {
      setError(
        result.error === "BLOCKED"
          ? "This account is blocked. Contact support."
          : "Email or password is incorrect.",
      );
      return;
    }

    const probe = await fetch("/api/auth/session");
    const session = await probe.json();
    const dest =
      params.get("callbackUrl") ||
      (session?.user?.role === "ADMIN" ? "/admin" : "/dashboard");
    router.push(dest);
    router.refresh();
  }

  return (
    <GlassCard>
      <SectionHeading kicker="Access" title="Login to the desk" />
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            defaultValue="demo@whealthgrid.com"
            className="mt-1 w-full rounded-lg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-lg px-3 py-2"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <GoldButton type="submit" disabled={busy} className="w-full">
          {busy ? "Signing in…" : "Enter"}
        </GoldButton>
      </form>
      <p className="mt-4 text-xs text-muted">
        Seed demo: demo@whealthgrid.com / Demo@12345 · Admin: admin@whealthgrid.com /
        Admin@12345
      </p>
      <p className="mt-3 text-sm text-muted">
        No desk yet?{" "}
        <Link href="/register" className="text-gold hover:text-gold-bright">
          Register
        </Link>
      </p>
    </GlassCard>
  );
}
