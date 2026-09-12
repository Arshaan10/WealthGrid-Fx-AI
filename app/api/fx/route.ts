import { NextResponse } from "next/server";
import { getFxQuotes } from "@/lib/fx";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getFxQuotes();
  return NextResponse.json(data);
}
