"use client";

import * as React from "react";
import { Loader2, Share2, Check, Crown, UserMinus, LogOut, Pencil, ShieldPlus, RefreshCw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberAvatar } from "@/components/member-avatar";
import { PaymentMethodsList } from "@/components/payment-methods-list";
import { MemberDetailSheet } from "@/components/member-detail-sheet";
import { useToast } from "@/components/ui/toaster";
import { CURRENCIES, type Member } from "@/lib/types";
import { useAppData } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import { timeAgo, shareInvite } from "@/lib/utils";

interface ActivityEntry {
  id: string;
  actorName: string;
  action: string;
  detail: string | null;
  createdAt: string;
}

export function ManageHouseholdSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { household, members, currentUserId, isAdmin, version, refresh, mutate } =
    useAppData();
  const { toast } = useToast();

  // Only fetch activity while the sheet is open.
  const activityQ = useFetch<{ activity: ActivityEntry[] }>(
    open ? "/api/activity" : null,
  );
  const refetchActivity = activityQ.refetch;
  React.useEffect(() => {
    if (open) void refetchActivity();
  }, [open, version, refetchActivity]);
  const activity = activityQ.data?.activity ?? [];

  const [editingName, setEditingName] = React.useState(false);
  const [name, setName] = React.useState(household?.name ?? "");
  const [savingName, setSavingName] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [regenBusy, setRegenBusy] = React.useState(false);
  const [currencyBusy, setCurrencyBusy] = React.useState(false);
  const [detailMember, setDetailMember] = React.useState<Member | null>(null);

  function openDetail(m: Member) {
    setDetailMember(m);
    onOpenChange(false); // close this sheet; detail opens on top
  }

  React.useEffect(() => {
    setName(household?.name ?? "");
  }, [household?.name]);

  async function saveName() {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch("/api/household", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: data.error || "Could not rename", variant: "error" });
        return;
      }
      toast({ title: "Household renamed", variant: "success" });
      setEditingName(false);
      await refresh();
    } finally {
      setSavingName(false);
    }
  }

  async function removeMember(userId: string, isSelf: boolean) {
    const who = members.find((m) => m.id === userId)?.name ?? "this member";
    const msg = isSelf
      ? "Leave this household?"
      : `Remove ${who} from the household?`;
    if (!window.confirm(msg)) return;

    setBusyId(userId);
    try {
      const res = await fetch(`/api/household/members/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: data.error || "Could not remove member", variant: "error" });
        return;
      }
      toast({
        title: isSelf ? "You left the household" : `Removed ${who}`,
        variant: "success",
      });
      onOpenChange(false);
      mutate();
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function changeCurrency(currency: string) {
    if (currency === household?.currency) return;
    setCurrencyBusy(true);
    try {
      const res = await fetch("/api/household", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: data.error || "Could not change currency", variant: "error" });
        return;
      }
      toast({ title: `Currency set to ${currency}`, variant: "success" });
      await refresh();
    } finally {
      setCurrencyBusy(false);
    }
  }

  async function regenCode() {
    if (!window.confirm("Generate a new invite code? The old code will stop working.")) return;
    setRegenBusy(true);
    try {
      const res = await fetch("/api/household/invite", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: data.error || "Could not regenerate code", variant: "error" });
        return;
      }
      toast({ title: "New invite code generated", variant: "success" });
      await refresh();
    } finally {
      setRegenBusy(false);
    }
  }

  async function makeAdmin(userId: string) {
    const who = members.find((m) => m.id === userId)?.name ?? "this member";
    if (!window.confirm(`Make ${who} an admin?`)) {
      return;
    }
    setBusyId(userId);
    try {
      const res = await fetch("/api/household/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: data.error || "Could not transfer admin", variant: "error" });
        return;
      }
      toast({ title: `${who} is now an admin`, variant: "success" });
      mutate();
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function shareLink() {
    if (!household) return;
    const how = await shareInvite(household.inviteCode, household.name);
    if (how === "copied") {
      setCopied(true);
      toast({ title: "Invite link copied", variant: "success" });
      setTimeout(() => setCopied(false), 2000);
    } else if (how === "failed") {
      toast({ title: "Couldn't share the link", variant: "error" });
    }
  }

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        <SheetHeader className="mb-4">
          <SheetTitle>Manage household</SheetTitle>
          <SheetDescription>
            {isAdmin
              ? "You're an admin — rename the household, share the invite code, or manage members."
              : "View household members."}
          </SheetDescription>
        </SheetHeader>

        {/* Name */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Name
          </p>
          {editingName ? (
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                autoFocus
              />
              <Button onClick={saveName} disabled={savingName}>
                {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-lg font-semibold">
                {household?.name}
              </span>
              {isAdmin && (
                <button
                  onClick={() => setEditingName(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                  aria-label="Rename household"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Invite code — admin only */}
        {isAdmin && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Invite link
                </p>
                <p className="text-xl font-bold tracking-[0.25em]">
                  {household?.inviteCode}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={shareLink}>
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Share"}
                </Button>
                <Button variant="outline" onClick={regenCode} disabled={regenBusy} aria-label="Regenerate invite code">
                  {regenBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator className="my-4" />
          </>
        )}

        {/* Currency — admin only */}
        {isAdmin && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Currency
                </p>
                <p className="text-sm text-muted-foreground">
                  How amounts are shown across the household.
                </p>
              </div>
              <Select
                value={household?.currency ?? "USD"}
                onValueChange={changeCurrency}
                disabled={currencyBusy}
              >
                <SelectTrigger className="w-36 flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.code} · {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-4" />
          </>
        )}

        {/* Members */}
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Members ({members.length})
        </p>
        <ul className="divide-y">
          {members.map((m) => {
            const isSelf = m.id === currentUserId;
            const canRemove = (isAdmin || isSelf) && !busyId;
            return (
              <li key={m.id} className="py-2.5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openDetail(m)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-0.5 text-left hover:opacity-80"
                  >
                    <MemberAvatar id={m.id} name={m.name} className="h-9 w-9" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {m.name}
                        {isSelf && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.email}
                      </p>
                    </div>
                  </button>
                  {m.role === "owner" ? (
                    <Badge variant="secondary" className="gap-1">
                      <Crown className="h-3 w-3" /> Admin
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-1">
                      {isAdmin && !isSelf && (
                        <button
                          onClick={() => makeAdmin(m.id)}
                          disabled={busyId === m.id}
                          aria-label={`Make ${m.name} admin`}
                          title="Make admin"
                          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-primary"
                        >
                          <ShieldPlus className="h-4 w-4" />
                        </button>
                      )}
                      {canRemove && (
                        <button
                          onClick={() => removeMember(m.id, isSelf)}
                          disabled={busyId === m.id}
                          aria-label={isSelf ? "Leave household" : `Remove ${m.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive"
                        >
                          {busyId === m.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isSelf ? (
                            <LogOut className="h-4 w-4" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {m.paymentMethods.length > 0 && (
                  <PaymentMethodsList
                    methods={m.paymentMethods}
                    className="mt-2 pl-12"
                  />
                )}
              </li>
            );
          })}
        </ul>

        {activity.length > 0 && (
          <>
            <Separator className="my-4" />
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recent activity
            </p>
            <ul className="space-y-2.5">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/60" />
                  <span className="flex-1">
                    <span className="font-medium">{a.actorName}</span>{" "}
                    <span className="text-muted-foreground">
                      {a.detail ?? a.action.replace(/_/g, " ")}
                    </span>
                  </span>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {timeAgo(a.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </SheetContent>
    </Sheet>

    <MemberDetailSheet
      member={detailMember}
      open={detailMember !== null}
      onOpenChange={(o) => !o && setDetailMember(null)}
    />
    </>
  );
}
