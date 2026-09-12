"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http, injected, type CreateConnectorFn } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors/walletConnect";

export function Web3Provider({
  children,
  projectId,
  rpcUrl,
}: {
  children: ReactNode;
  projectId?: string | null;
  rpcUrl?: string | null;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [config] = useState(() => {
    const connectors: CreateConnectorFn[] = [injected({ shimDisconnect: true })];
    if (projectId) {
      connectors.push(
        walletConnect({
          projectId,
          showQrModal: true,
          metadata: {
            name: "Whealth Grid Fx AI",
            description: "Member desk wallet connect for USDT deposits and payouts.",
            url: typeof window === "undefined" ? "http://localhost:3000" : window.location.origin,
            icons: ["https://avatars.githubusercontent.com/u/37784886"],
          },
        }) as CreateConnectorFn,
      );
    }
    return createConfig({
      chains: [bscTestnet, bsc],
      connectors,
      transports: {
        [bscTestnet.id]: http(rpcUrl || "https://bsc-testnet-rpc.publicnode.com"),
        [bsc.id]: http(rpcUrl || "https://bsc-dataseed.binance.org"),
      },
      ssr: true,
    });
  });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
