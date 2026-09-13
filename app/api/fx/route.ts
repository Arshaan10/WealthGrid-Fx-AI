import { NextResponse } from "next/server";
import { getFxQuotes } from "@/lib/fx";

export const revalidate = 60;

export async function GET() {
  const data = await getFxQuotes();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
