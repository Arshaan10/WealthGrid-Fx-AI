import { prisma } from "@/lib/prisma";

export async function writeAudit(input: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      meta: input.meta ? JSON.stringify(input.meta) : null,
    },
  });
}
