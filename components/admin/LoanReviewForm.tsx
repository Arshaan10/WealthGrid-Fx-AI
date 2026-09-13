"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GoldButton } from "@/components/brand/GoldButton";
import { flashLoan } from "@/config/rewards";
import { formatUsd } from "@/lib/utils";

export function LoanReviewForm({
  applicationId,
  requested,
}: {
  applicationId: string;
  requested: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"APPROVE" | "REJECT" | null>(null);

  async function review(form: HTMLFormElement, decision: "APPROVE" | "REJECT") {
    setBusy(decision);
    setError(null);
    const data = new FormData(form);
    const res = await fetch("/api/admin/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: applicationId,
        decision,
        amount: Number(data.get("amount")),
        note: String(data.get("note") ?? ""),
      }),
    });
    const payload = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(payload.error ?? "Review failed");
      return;
    }
    router.refresh();
  }

  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void review(event.currentTarget, "APPROVE");
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          name="amount"
          type="number"
          min={flashLoan.minAmountUsd}
          max={requested}
          step="0.01"
          defaultValue={requested}
          className="w-full rounded-lg px-3 py-2 sm:max-w-[10rem]"
        />
        <input
          name="note"
          type="text"
          maxLength={240}
          placeholder="Ops note"
          className="w-full rounded-lg px-3 py-2"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <GoldButton type="submit" disabled={Boolean(busy)}>
          {busy === "APPROVE" ? "Approving…" : `Approve ≤ ${formatUsd(requested)}`}
        </GoldButton>
        <GoldButton
          type="button"
          variant="danger"
          disabled={Boolean(busy)}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form) void review(form, "REJECT");
          }}
        >
          {busy === "REJECT" ? "Rejecting…" : "Reject"}
        </GoldButton>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </form>
  );
}
