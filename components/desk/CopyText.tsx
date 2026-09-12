"use client";

import { useState } from "react";
import { GoldButton } from "@/components/brand/GoldButton";

export function CopyText({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <GoldButton type="button" variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => void copy()}>
      {copied ? "Copied" : label}
    </GoldButton>
  );
}
