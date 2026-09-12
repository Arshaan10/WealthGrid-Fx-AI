import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveJobDate, runDailyRewardJob } from "@/lib/rewards";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const rawDate = typeof body?.date === "string" ? body.date : null;

  try {
    const date = resolveJobDate(rawDate);
    const result = await runDailyRewardJob({ date, actorId: session.user.id });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Daily reward job failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
