"use client";

import * as React from "react";
import { Loader2, Plus, Trash2, Pencil, Eye, MousePointerClick, Megaphone } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { useFetch } from "@/lib/use-fetch";
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

  React.useEffect(() => {
    if (open) void refetch();
  }, [open, refetch]);

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
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Ads
          </SheetTitle>
          <SheetDescription>
            Self-served sponsored slots. You keep 100% of what you sell.
          </SheetDescription>
        </SheetHeader>

        {draft ? (
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ad-title">Title</Label>
              <Input id="ad-title" value={draft.title} maxLength={120} required
                onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-body">Body (optional)</Label>
              <Input id="ad-body" value={draft.body} maxLength={280}
                onChange={(e) => set("body", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-link">Destination URL</Label>
              <Input id="ad-link" type="url" placeholder="https://…" value={draft.linkUrl} required
                onChange={(e) => set("linkUrl", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-img">Image URL (optional)</Label>
              <Input id="ad-img" type="url" placeholder="https://…" value={draft.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ad-cta">Button text</Label>
                <Input id="ad-cta" value={draft.cta} maxLength={40} placeholder="Learn more"
                  onChange={(e) => set("cta", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ad-weight">Weight</Label>
                <Input id="ad-weight" type="number" min={1} max={100} value={draft.weight}
                  onChange={(e) => set("weight", parseInt(e.target.value) || 1)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Placement</Label>
              <Select value={draft.placement} onValueChange={(v) => set("placement", v as AdPlacement)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AD_PLACEMENTS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.active}
                onChange={(e) => set("active", e.target.checked)} className="h-4 w-4" />
              Active (visible to users)
            </label>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1"
                onClick={() => { setDraft(null); setEditingId(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Save" : "Create"}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <Button onClick={startNew} className="w-full">
              <Plus className="h-4 w-4" /> New ad
            </Button>
            <Separator className="my-4" />
            {q.loading && !q.data ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : ads.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No ads yet. Create one to start earning.
              </p>
            ) : (
              <ul className="space-y-2">
                {ads.map((ad) => {
                  const ctr = ad.impressions > 0
                    ? ((ad.clicks / ad.impressions) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <li key={ad.id} className="rounded-lg border p-3">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{ad.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant={ad.active ? "success" : "secondary"}>
                              {ad.active ? "Active" : "Paused"}
                            </Badge>
                            <span className="capitalize">{ad.placement}</span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> {ad.impressions}
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointerClick className="h-3 w-3" /> {ad.clicks}
                            </span>
                            <span>CTR {ctr}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1"
                          onClick={() => toggleActive(ad)} disabled={busyId === ad.id}>
                          {busyId === ad.id ? <Loader2 className="h-4 w-4 animate-spin" /> : ad.active ? "Pause" : "Activate"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEdit(ad)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => remove(ad)} disabled={busyId === ad.id}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
