import { DeskWeb3 } from "@/components/providers/DeskWeb3";

export default function WithdrawLayout({ children }: { children: React.ReactNode }) {
  return <DeskWeb3>{children}</DeskWeb3>;
}
