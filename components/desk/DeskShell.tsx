"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ForexAtmosphere } from "@/components/brand/ForexAtmosphere";
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
    <div className="relative min-h-screen">
      <ForexAtmosphere variant="desk" />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1400px] lg:grid-cols-[240px_1fr]">
        <div className="hidden lg:block">
          <div className="sticky top-0 h-screen">
            <AppSidebar items={items} home={home} mode={mode} />
          </div>
        </div>
        <div className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between border-b border-gold-line/40 bg-black/40 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-md border border-gold-line text-gold lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">
                  Whealth Grid Fx AI
                </p>
                <h1 className="font-display text-xl text-cream">{title}</h1>
              </div>
            </div>
            <p className="text-xs text-muted">{userLabel}</p>
          </header>
          <div className="flex-1 px-4 py-6 sm:px-6">{children}</div>
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
          <div className="relative h-full w-72">
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
