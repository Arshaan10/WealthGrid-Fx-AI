import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { brand } from "@/config/rewards";
import { getPublicChainConfig } from "@/lib/chain";
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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: brand.name,
    template: `%s · ${brand.name}`,
  },
  description:
    "Whealth Grid Fx AI — premium Forex AI grid desk. Packages, ranks, and network rewards. Wallet connect and treasury payouts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const chain = getPublicChainConfig();
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} font-sans antialiased`}>
        <SessionProvider>
          <Web3Provider projectId={chain.walletConnectProjectId} rpcUrl={chain.rpcUrl}>
            {children}
          </Web3Provider>
        </SessionProvider>
      </body>
    </html>
  );
}
