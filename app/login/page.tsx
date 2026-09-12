import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading desk access…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </MarketingShell>
  );
}
