import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AccessError, assertMemberCanTransact } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { isEvmAddress } from "@/lib/address";
import { assertBscNetwork, isPayoutConfigured } from "@/lib/chain";
import { attemptOnChainPayout } from "@/lib/payout";
import { amountSchema } from "@/lib/validators";
import { getWalletSnapshot } from "@/lib/wallets";
import { executeAutoWithdrawal } from "@/lib/withdraw";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertMemberCanTransact(session.user.id);
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const body = await request.json().catch(() => null);
  const parsed = amountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  }

  const toAddress = parsed.data.toAddress?.trim() || "";
  try {
    assertBscNetwork();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "BEP-20 network required." },
      { status: 400 },
    );
  }

  if (isPayoutConfigured() && !isEvmAddress(toAddress)) {
    return NextResponse.json(
      { error: "Connect a Web3 wallet or enter a valid BNB Smart Chain payout address." },
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
    const wallets = await getWalletSnapshot(session.user.id);

    return NextResponse.json({
      ok: true,
      ...result,
      status: payout.status,
      txHash: payout.txHash,
      sendConfigured: payout.sendConfigured,
      sendError: payout.sendError,
      message: payout.message,
      wallets,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Withdrawal failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
