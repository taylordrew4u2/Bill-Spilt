"use client";

import * as React from "react";
import { AlertCircle, Loader2, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { useFetch } from "@/lib/use-fetch";
import { cn } from "@/lib/utils";
import { AD_PLACEMENTS, type Ad, type AdPlacement } from "@/lib/types";

type Draft = {
  title: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  cta: string;
  placement: AdPlacement;
  weight: number;
  active: boolean;
};

const EMPTY: Draft = {
  title: "",
  body: "",
  imageUrl: "",
  linkUrl: "",
  cta: "",
  placement: "all",
  weight: 1,
  active: true,
};

function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
      {children}
    </h3>
  );
}

/** A form section's heading. Fields sit straight on the sheet (no card
 *  around them), so the heading carries the grouping. */
function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-lg font-semibold leading-snug">
      {children}
    </h3>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse items-center rounded-xl bg-muted/60 px-2 py-2 text-center">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-base font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function AdsAdminSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const q = useFetch<{ ads: Ad[] }>(open ? "/api/ads?all=1" : null);
  const refetch = q.refetch;
  const ads = q.data?.ads ?? [];

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const topRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) void refetch();
  }, [open, refetch]);

  // Switching between the list and the form starts at the top of the sheet.
  const editing = draft !== null;
  React.useEffect(() => {
    topRef.current?.closest("[role=dialog]")?.scrollTo({ top: 0 });
  }, [editing]);

  function startNew() {
    setEditingId(null);
    setDraft({ ...EMPTY });
  }
  function startEdit(ad: Ad) {
    setEditingId(ad.id);
    setDraft({
      title: ad.title,
      body: ad.body ?? "",
      imageUrl: ad.imageUrl ?? "",
      linkUrl: ad.linkUrl,
      cta: ad.cta ?? "",
      placement: ad.placement,
      weight: ad.weight,
      active: ad.active,
    });
  }
  function cancelEdit() {
    setDraft(null);
    setEditingId(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/ads/${editingId}` : "/api/ads", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: data.error || "Could not save ad", variant: "error" });
        return;
      }
      toast({ title: editingId ? "Ad updated" : "Ad created", variant: "success" });
      setDraft(null);
      setEditingId(null);
      await refetch();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(ad: Ad) {
    setBusyId(ad.id);
    try {
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ad.title,
          body: ad.body,
          imageUrl: ad.imageUrl,
          linkUrl: ad.linkUrl,
          cta: ad.cta,
          placement: ad.placement,
          weight: ad.weight,
          active: !ad.active,
        }),
      });
      if (res.ok) await refetch();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(ad: Ad) {
    if (!window.confirm(`Delete “${ad.title}”?`)) return;
    setBusyId(ad.id);
    try {
      const res = await fetch(`/api/ads/${ad.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Ad deleted", variant: "success" });
        await refetch();
      }
    } finally {
      setBusyId(null);
    }
  }

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        <div ref={topRef} />
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
            <span className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary xs:flex">
              <Megaphone className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <SheetTitle>
                {draft ? (editingId ? "Edit ad" : "New ad") : "Ads"}
              </SheetTitle>
              <SheetDescription>
                {draft
                  ? "What it says, where it links, and where it shows."
                  : "Self-served sponsored slots. You keep 100% of what you sell."}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {draft ? (
          <form onSubmit={save} className="space-y-8">
            <section aria-labelledby="ad-content" className="space-y-5">
              <SectionTitle id="ad-content">Content</SectionTitle>
              <div className="space-y-2">
                <Label htmlFor="ad-title">Title</Label>
                <Input
                  id="ad-title"
                  value={draft.title}
                  maxLength={120}
                  required
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-body">
                  Body <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <textarea
                  id="ad-body"
                  value={draft.body}
                  maxLength={280}
                  rows={3}
                  onChange={(e) => set("body", e.target.value)}
                  className="flex min-h-24 w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-base leading-snug ring-offset-background placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-cta">
                  Button text{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="ad-cta"
                  value={draft.cta}
                  maxLength={40}
                  placeholder="Learn more"
                  onChange={(e) => set("cta", e.target.value)}
                />
              </div>
            </section>

            <section aria-labelledby="ad-links" className="space-y-5">
              <SectionTitle id="ad-links">Links</SectionTitle>
              <div className="space-y-2">
                <Label htmlFor="ad-link">Destination URL</Label>
                <Input
                  id="ad-link"
                  type="url"
                  inputMode="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="https://…"
                  value={draft.linkUrl}
                  required
                  onChange={(e) => set("linkUrl", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-img">
                  Image URL{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="ad-img"
                  type="url"
                  inputMode="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="https://…"
                  value={draft.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                />
              </div>
            </section>

            <section aria-labelledby="ad-delivery" className="space-y-5">
              <SectionTitle id="ad-delivery">Delivery</SectionTitle>
              <div className="space-y-2">
                <Label htmlFor="ad-placement">Placement</Label>
                <Select
                  value={draft.placement}
                  onValueChange={(v) => set("placement", v as AdPlacement)}
                >
                  <SelectTrigger id="ad-placement">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AD_PLACEMENTS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-weight">Weight</Label>
                <Input
                  id="ad-weight"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  value={draft.weight}
                  onChange={(e) => set("weight", parseInt(e.target.value) || 1)}
                  aria-describedby="ad-weight-hint"
                />
                <p id="ad-weight-hint" className="text-sm text-muted-foreground">
                  1–100. Higher weights show more often.
                </p>
              </div>
              <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors hover:bg-accent">
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium">Active</span>
                  <span className="block text-sm text-muted-foreground">
                    Visible to users as soon as it&apos;s saved
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => set("active", e.target.checked)}
                  className="h-6 w-6 flex-shrink-0 cursor-pointer accent-primary"
                />
              </label>
            </section>

            <div className="space-y-2">
              <Button type="submit" size="lg" className="w-full" disabled={saving}>
                {saving && <Loader2 className="animate-spin" aria-hidden />}
                {editingId ? "Save changes" : "Create ad"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <Button type="button" onClick={startNew} className="w-full">
              <Plus aria-hidden /> New ad
            </Button>

            {q.loading && !q.data ? (
              <div role="status">
                <span className="sr-only">Loading ads…</span>
                <Skeleton className="mb-3 ml-1 h-4 w-20" />
                <Card className="divide-y overflow-hidden">
                  {[0, 1].map((i) => (
                    <div key={i} className="space-y-3 p-4">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-14 w-full rounded-xl" />
                    </div>
                  ))}
                </Card>
              </div>
            ) : q.error && !q.data ? (
              <Card role="alert" className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-negative-soft text-negative">
                  <AlertCircle className="h-5 w-5" aria-hidden />
                </span>
                <p className="min-w-0 flex-1 text-sm text-muted-foreground">{q.error}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                  Retry
                </Button>
              </Card>
            ) : ads.length === 0 ? (
              <Card className="flex flex-col items-center px-6 py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Megaphone className="h-7 w-7" aria-hidden />
                </span>
                <p className="mt-4 text-lg font-semibold">No ads yet</p>
                <p className="mt-1 max-w-xs text-balance text-sm text-muted-foreground">
                  Create one to start earning.
                </p>
              </Card>
            ) : (
              <section aria-labelledby="ads-list">
                <SectionLabel id="ads-list">Your ads ({ads.length})</SectionLabel>
                <Card className="overflow-hidden">
                  <ul className="divide-y">
                    {ads.map((ad) => {
                      const ctr = ad.impressions > 0
                        ? ((ad.clicks / ad.impressions) * 100).toFixed(1)
                        : "0.0";
                      const placement =
                        AD_PLACEMENTS.find((p) => p.value === ad.placement)?.label ??
                        ad.placement;
                      const busy = busyId === ad.id;
                      return (
                        <li key={ad.id} className="p-4">
                          {/* The title gets the full width; the status pill
                              flows with the other facts underneath. */}
                          <p className="line-clamp-2 break-words text-base font-semibold leading-snug">
                            {ad.title}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                ad.active
                                  ? "bg-positive-soft text-positive"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {ad.active ? "Active" : "Paused"}
                            </span>
                            <span>
                              {placement} · Weight {ad.weight}
                            </span>
                          </p>
                          <dl className="mt-3 grid grid-cols-3 gap-2">
                            <Stat label="Views" value={ad.impressions.toLocaleString()} />
                            <Stat label="Clicks" value={ad.clicks.toLocaleString()} />
                            <Stat label="CTR" value={`${ctr}%`} />
                          </dl>
                          <div className="mt-3 flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="min-w-0 flex-1 px-3"
                              onClick={() => toggleActive(ad)}
                              disabled={busy}
                            >
                              {busy ? (
                                <Loader2 className="animate-spin" aria-label="Working" />
                              ) : ad.active ? (
                                "Pause"
                              ) : (
                                "Activate"
                              )}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="min-w-0 flex-1 px-3"
                              onClick={() => startEdit(ad)}
                            >
                              <Pencil aria-hidden /> Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="w-11 flex-shrink-0 px-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => remove(ad)}
                              disabled={busy}
                              aria-label={`Delete “${ad.title}”`}
                            >
                              <Trash2 aria-hidden />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
