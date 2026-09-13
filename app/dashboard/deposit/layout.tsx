import { DeskWeb3 } from "@/components/providers/DeskWeb3";

export default function DepositLayout({ children }: { children: React.ReactNode }) {
  return <DeskWeb3>{children}</DeskWeb3>;
}
