"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { GoldLink } from "@/components/brand/GoldButton";
import { nav } from "@/config/site";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gold-line/60 bg-[rgba(7,7,8,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-5 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-xs uppercase tracking-[0.16em] text-muted transition hover:text-gold-bright",
                pathname === item.href && "text-gold-bright",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <GoldLink href="/login" variant="ghost">
            Login
          </GoldLink>
          <GoldLink href="/register">Open desk</GoldLink>
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-md border border-gold-line text-gold lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-gold-line/50 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-sm text-cream"
              >
                {item.label}
              </Link>
            ))}
            <GoldLink href="/login" variant="ghost">
              Login
            </GoldLink>
            <GoldLink href="/register">Open desk</GoldLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
