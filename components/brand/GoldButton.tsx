import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary:
    "bg-gold-sheen text-[#1a1406] shadow-gold hover:brightness-110",
  ghost:
    "border border-gold-line bg-black/30 text-cream hover:border-gold-bright/50 hover:bg-gold-dim",
  danger:
    "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
};

export function GoldButton({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function GoldLink({
  href,
  children,
  className,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: keyof typeof variants;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
