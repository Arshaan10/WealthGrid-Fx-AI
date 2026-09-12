"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function OnchainSync({ intervalMs = 12000 }: { intervalMs?: number }) {
  const router = useRouter();
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (busy.current) return;
      busy.current = true;
      try {
        const res = await fetch("/api/desk/sync", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (
          !cancelled &&
          res.ok &&
          ((data.creditedDeposits?.length ?? 0) > 0 || (data.confirmedPayouts?.length ?? 0) > 0)
        ) {
          router.refresh();
        }
      } catch {
        // Watcher is best-effort; the desk stays usable if RPC is down.
      } finally {
        busy.current = false;
      }
    }

    void tick();
    const id = window.setInterval(() => void tick(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalMs, router]);

  return null;
}
