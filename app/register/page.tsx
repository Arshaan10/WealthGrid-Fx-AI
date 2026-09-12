import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <RegisterForm />
      </div>
    </MarketingShell>
  );
}
