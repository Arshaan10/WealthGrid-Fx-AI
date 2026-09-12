import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AccessError, assertMemberCanTransact } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { recordDepositIntent } from "@/lib/deposit-credit";
import { amountSchema } from "@/lib/validators";
import { getWalletSnapshot, type WalletType } from "@/lib/wallets";

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

  try {
    const result = await recordDepositIntent({
      userId: session.user.id,
      amount: parsed.data.amount,
      walletType: parsed.data.walletType as WalletType,
      txHash: parsed.data.txHash || null,
      fromAddress: parsed.data.fromAddress || null,
      note: parsed.data.note,
      watch: parsed.data.watch,
    });

    const wallets = await getWalletSnapshot(session.user.id);
    return NextResponse.json({
      ok: true,
      id: result.intent.id,
      status: result.intent.status,
      txHash: result.intent.txHint,
      verified: result.verified,
      reused: result.reused,
      verifyError: result.verifyError ?? null,
      confirmations: result.intent.confirmations,
      requiredConfirmations: result.intent.requiredConfs,
      wallets,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not record deposit";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
