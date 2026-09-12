import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { brand } from "@/config/rewards";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: brand.name,
    template: `%s · ${brand.name}`,
  },
  description:
    "Whealth Grid Fx AI — premium Forex AI grid desk. Packages, ranks, and network rewards. Phase 1 control plane.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
