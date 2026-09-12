import { GlassCard } from "@/components/brand/GlassCard";
import { AnnouncementManager } from "@/components/admin/AnnouncementManager";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const items = await prisma.announcement.findMany({
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">Announcements</h2>
        <p className="mt-2 text-sm text-muted">
          Published notes appear on the member overview.
        </p>
      </GlassCard>
      <AnnouncementManager
        items={items.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          published: item.published,
          author: item.author.name,
          when: formatDate(item.createdAt),
        }))}
      />
    </div>
  );
}
