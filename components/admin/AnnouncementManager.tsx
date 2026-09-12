"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { StatusPill } from "@/components/desk/StatusPill";

type Item = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  author: string;
  when: string;
};

export function AnnouncementManager({ items }: { items: Item[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        body: form.get("body"),
        published: true,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  async function toggle(id: string, published: boolean) {
    await fetch("/api/admin/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, published }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <>
      <GlassCard>
        <form onSubmit={create} className="space-y-3">
          <input
            name="title"
            required
            placeholder="Title"
            className="w-full rounded-lg px-3 py-2"
          />
          <textarea
            name="body"
            required
            rows={4}
            placeholder="Body"
            className="w-full rounded-lg px-3 py-2"
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <GoldButton type="submit" disabled={busy}>
            {busy ? "Publishing…" : "Publish announcement"}
          </GoldButton>
        </form>
      </GlassCard>
      <div className="space-y-3">
        {items.map((item) => (
          <GlassCard key={item.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl">{item.title}</h3>
                <p className="mt-1 text-xs text-muted">
                  {item.author} · {item.when}
                </p>
              </div>
              <StatusPill status={item.published ? "published" : "draft"} />
            </div>
            <p className="mt-3 text-sm text-muted">{item.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <GoldButton
                type="button"
                variant="ghost"
                onClick={() => void toggle(item.id, !item.published)}
              >
                {item.published ? "Unpublish" : "Publish"}
              </GoldButton>
              <GoldButton type="button" variant="danger" onClick={() => void remove(item.id)}>
                Delete
              </GoldButton>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
