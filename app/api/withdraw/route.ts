import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isEvmAddress } from "@/lib/address";
import { isPayoutConfigured } from "@/lib/chain";
import { attemptOnChainPayout } from "@/lib/payout";
import { amountSchema } from "@/lib/validators";
import { executeAutoWithdrawal } from "@/lib/withdraw";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = amountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  }

  const toAddress = parsed.data.toAddress?.trim() || "";
  if (isPayoutConfigured() && !isEvmAddress(toAddress)) {
    return NextResponse.json(
      { error: "Connect a wallet or enter a valid payout address before withdrawing." },
      { status: 400 },
    );
  }

  try {
    const result = await executeAutoWithdrawal({
      userId: session.user.id,
      type: parsed.data.walletType,
      amount: parsed.data.amount,
      toAddress: toAddress || null,
      note: parsed.data.note,
    });

    const payout = await attemptOnChainPayout(result.id);

    return NextResponse.json({
      ok: true,
      ...result,
      status: payout.status,
      txHash: payout.txHash,
      sendConfigured: payout.sendConfigured,
      sendError: payout.sendError,
      message: payout.message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Withdrawal failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
