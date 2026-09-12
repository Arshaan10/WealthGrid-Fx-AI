"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Landmark,
  Headset,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Package,
  ScrollText,
  Shield,
  Trophy,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const userIcons: Record<string, typeof Wallet> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/wallets": Wallet,
  "/dashboard/package": Package,
  "/dashboard/deposit": ArrowDownLeft,
  "/dashboard/withdraw": ArrowUpRight,
  "/dashboard/referrals": Users,
  "/dashboard/rewards": Gift,
  "/dashboard/support": LifeBuoy,
  "/dashboard/profile": UserRound,
};

const adminIcons: Record<string, typeof Wallet> = {
  "/admin": Shield,
  "/admin/treasury": Landmark,
  "/admin/users": Users,
  "/admin/support": Headset,
  "/admin/packages": Package,
  "/admin/queue": ArrowDownLeft,
  "/admin/rewards": Gift,
  "/admin/ranks": Trophy,
  "/admin/announcements": Megaphone,
  "/admin/audit": ScrollText,
};

export function AppSidebar({
  items,
  home,
  mode,
}: {
  items: readonly { href: string; label: string }[];
  home: string;
  mode: "user" | "admin";
}) {
  const pathname = usePathname();
  const icons = mode === "admin" ? adminIcons : userIcons;

  return (
    <aside className="flex h-full flex-col border-r border-gold-line/50 bg-black/50">
      <div className="border-b border-gold-line/40 px-4 py-4">
        <Logo href={home} compact />
        <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-gold/70">
          {mode === "admin" ? "Admin desk" : "Member desk"}
        </p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {items.map((item) => {
          const Icon = icons[item.href] ?? LayoutDashboard;
          const active =
            item.href === home
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-gold-dim hover:text-cream",
                active && "bg-gold-dim text-gold-bright",
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-gold-line/40 p-3">
        {mode === "admin" ? (
          <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-xs text-muted hover:text-gold">
            Member desk →
          </Link>
        ) : (
          <Link href="/" className="block rounded-lg px-3 py-2 text-xs text-muted hover:text-gold">
            Marketing site →
          </Link>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-gold-dim hover:text-cream"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
