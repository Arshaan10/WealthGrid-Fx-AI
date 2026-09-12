import { NextResponse } from "next/server";
import { getPublicChainConfig } from "@/lib/chain";

export async function GET() {
  return NextResponse.json(getPublicChainConfig());
}
