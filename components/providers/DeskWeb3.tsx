import { Web3Provider } from "@/components/providers/Web3Provider";
import { getPublicChainConfig } from "@/lib/chain";

/** Wallet UI lives only on deposit / withdraw / profile — not marketing or overview. */
export function DeskWeb3({ children }: { children: React.ReactNode }) {
  const chain = getPublicChainConfig();
  return (
    <Web3Provider
      projectId={chain.walletConnectProjectId}
      rpcUrl={chain.rpcUrl}
      chainId={chain.chainId}
    >
      {children}
    </Web3Provider>
  );
}
