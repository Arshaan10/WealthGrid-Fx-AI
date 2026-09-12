import type { Metadata } from "next";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ContactForm } from "@/components/marketing/ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <SectionHeading
          kicker="Desk"
          title="Contact the house"
          lede="Phase 1 stores inquiries on the audit log. No mailbox integration yet."
        />
        <div className="mt-10">
          <ContactForm />
        </div>
        <RiskDisclaimer compact className="mt-8" />
      </div>
    </MarketingShell>
  );
}
