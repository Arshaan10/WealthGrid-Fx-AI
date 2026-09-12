import { NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import { contactSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete all fields." }, { status: 400 });
  }

  await writeAudit({
    action: "CONTACT",
    entity: "Inquiry",
    meta: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
