"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ForexAtmosphere } from "@/components/brand/ForexAtmosphere";
import { ForexTicker } from "@/components/brand/ForexTicker";
import { AppSidebar } from "@/components/desk/AppSidebar";
import type { ReactNode } from "react";

export function DeskShell({
  children,
  title,
  items,
  home,
  mode,
  userLabel,
}: {
  children: ReactNode;
  title: string;
  items: readonly { href: string; label: string }[];
  home: string;
  mode: "user" | "admin";
  userLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative isolate min-h-dvh w-full overflow-x-hidden">
      <ForexAtmosphere variant="desk" />
      <div className="relative z-10 flex min-h-dvh w-full">
        <div className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-0 h-dvh">
            <AppSidebar items={items} home={home} mode={mode} />
          </div>
        </div>
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col overflow-x-hidden">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gold-line/40 bg-black/40 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-gold-line text-gold lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">
                  Whealth Grid Fx AI
                </p>
                <h1 className="truncate font-display text-xl text-cream">{title}</h1>
              </div>
            </div>
            <p className="max-w-[40%] shrink-0 truncate text-right text-xs text-muted">{userLabel}</p>
          </header>
          {mode === "user" ? <ForexTicker compact /> : null}
          <div className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6">{children}</div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
            aria-label="Close navigation overlay"
          />
          <div className="relative h-full w-72 max-w-[80vw]">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 text-gold"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            <AppSidebar items={items} home={home} mode={mode} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
