"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http, injected, type CreateConnectorFn } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors/walletConnect";

const BSC_MAINNET_ID = 56;

export function Web3Provider({
  children,
  projectId,
  rpcUrl,
  chainId,
}: {
  children: ReactNode;
  projectId?: string | null;
  rpcUrl?: string | null;
  chainId?: number;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [config] = useState(() => {
    const primary = chainId === BSC_MAINNET_ID ? bsc : bscTestnet;
    const secondary = chainId === BSC_MAINNET_ID ? bscTestnet : bsc;
    const connectors: CreateConnectorFn[] = [
      injected({
        shimDisconnect: true,
        unstable_shimAsyncInject: 2_000,
      }),
    ];
    if (projectId) {
      connectors.push(
        walletConnect({
          projectId,
          showQrModal: true,
          metadata: {
            name: "Whealth Grid Fx AI",
            description: "Connect any Web3 / DEX wallet for USDT BEP-20 deposits and payouts.",
            url: typeof window === "undefined" ? "http://localhost:3000" : window.location.origin,
            icons: ["https://avatars.githubusercontent.com/u/37784886"],
          },
        }) as CreateConnectorFn,
      );
    }
    return createConfig({
      chains: [primary, secondary],
      connectors,
      transports: {
        [bsc.id]: http(rpcUrl && chainId === BSC_MAINNET_ID ? rpcUrl : "https://bsc-dataseed.binance.org"),
        [bscTestnet.id]: http(
          rpcUrl && chainId !== BSC_MAINNET_ID ? rpcUrl : "https://bsc-testnet-rpc.publicnode.com",
        ),
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
