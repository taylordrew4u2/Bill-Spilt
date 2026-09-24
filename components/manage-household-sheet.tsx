"use client";

import * as React from "react";
import {
  Activity,
  CalendarClock,
  Check,
  ChevronRight,
  Coins,
  Crown,
  HandCoins,
  Home,
  Loader2,
  LogOut,
  Pencil,
  Receipt,
  RefreshCw,
  Repeat,
  Share2,
  SkipForward,
  Trash2,
  Undo2,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
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
import { MemberAvatar } from "@/components/member-avatar";
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

/** How many activity entries show before "Show all". */
const ACTIVITY_PREVIEW = 5;

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  expense_added: Receipt,
  expense_edited: Pencil,
  expense_deleted: Trash2,
  settlement_recorded: HandCoins,
  settled_all: HandCoins,
  settlement_undone: Undo2,
  recurring_added: Repeat,
  recurring_charged: Repeat,
  recurring_due: CalendarClock,
  recurring_skipped: SkipForward,
  household_renamed: Home,
  currency_changed: Coins,
  invite_regenerated: RefreshCw,
  member_joined: UserPlus,
  member_left: LogOut,
  member_removed: UserMinus,
  admin_transferred: Crown,
};

function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
      {children}
    </h3>
  );
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
  const [showAllActivity, setShowAllActivity] = React.useState(false);
  // The member stays set while the detail sheet animates closed.
  const [detailMember, setDetailMember] = React.useState<Member | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const me = members.find((m) => m.id === currentUserId);

  function openDetail(m: Member) {
    setDetailMember(m);
    setDetailOpen(true);
    onOpenChange(false); // close this sheet; detail opens on top
  }

  // Closing a member's sheet steps back to this one, like a "Back" button.
  function closeDetail() {
    setDetailOpen(false);
    onOpenChange(true);
  }

  React.useEffect(() => {
    setName(household?.name ?? "");
  }, [household?.name]);

  // Start fresh each time the sheet opens.
  React.useEffect(() => {
    if (!open) {
      setEditingName(false);
      setShowAllActivity(false);
    }
  }, [open]);

  function cancelRename() {
    setName(household?.name ?? "");
    setEditingName(false);
  }

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
      setDetailOpen(false);
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

  // Read the member from live data so a promotion shows up right away.
  const detail = detailMember
    ? (members.find((m) => m.id === detailMember.id) ?? detailMember)
    : null;
  const detailIsSelf = detail?.id === currentUserId;
  // Admins can't be demoted or removed from here; anyone else can be promoted
  // (by an admin) or removed (by an admin, or by themselves to leave).
  const detailIsMember = !!detail && detail.role !== "owner";
  const canPromote = detailIsMember && isAdmin && !detailIsSelf;
  const canRemove = detailIsMember && (isAdmin || detailIsSelf);

  const visibleActivity = showAllActivity
    ? activity
    : activity.slice(0, ACTIVITY_PREVIEW);

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
            <span className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary min-[360px]:flex">
              <Home className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <SheetTitle className="line-clamp-2 break-words leading-tight">
                {household?.name ?? "Household"}
              </SheetTitle>
              <SheetDescription>
                {members.length} {members.length === 1 ? "member" : "members"}
                {isAdmin ? " · You're an admin" : ""}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Invite — admin only */}
          {isAdmin && household && (
            <section aria-labelledby="household-invite">
              <SectionLabel id="household-invite">Invite roommates</SectionLabel>
              <Card className="divide-y overflow-hidden">
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Invite code</p>
                  <p className="mt-1 select-all pl-[0.3em] text-3xl font-bold tabular-nums tracking-[0.3em]">
                    {household.inviteCode}
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-balance text-sm text-muted-foreground">
                    Send the join link, or have roommates enter this code.
                  </p>
                  <Button type="button" className="mt-4 w-full" onClick={shareLink}>
                    {copied ? (
                      <>
                        <Check aria-hidden /> Link copied
                      </>
                    ) : (
                      <>
                        <Share2 aria-hidden /> Share invite link
                      </>
                    )}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={regenCode}
                  disabled={regenBusy}
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent active:bg-accent disabled:pointer-events-none disabled:opacity-60"
                >
                  <span className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground min-[360px]:flex">
                    {regenBusy ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="h-5 w-5" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-base font-medium">
                      {/* The icon tile is hidden on the narrowest screens,
                          so the busy spinner moves next to the label there. */}
                      {regenBusy && (
                        <Loader2
                          className="h-5 w-5 animate-spin text-muted-foreground min-[360px]:hidden"
                          aria-hidden
                        />
                      )}
                      Get a new code
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      The current code and link stop working.
                    </span>
                  </span>
                </button>
              </Card>
            </section>
          )}

          {/* Members */}
          <section aria-labelledby="household-members">
            <SectionLabel id="household-members">
              Members ({members.length})
            </SectionLabel>
            <Card className="overflow-hidden">
              <ul className="divide-y">
                {members.map((m) => {
                  const isSelf = m.id === currentUserId;
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => openDetail(m)}
                        className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent active:bg-accent"
                      >
                        {/* The avatar only repeats the name, so the narrowest
                            screens give its width to the name and email. */}
                        <MemberAvatar
                          id={m.id}
                          name={m.name}
                          className="hidden h-10 w-10 min-[360px]:flex"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 break-words text-base font-medium leading-snug">
                            {m.name}
                            {isSelf && (
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                (you)
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                            {m.role === "owner" && (
                              <span className="inline-flex flex-shrink-0 items-center gap-1 font-semibold text-primary">
                                <Crown className="h-4 w-4" aria-hidden /> Admin
                                <span aria-hidden className="font-normal text-muted-foreground">
                                  ·
                                </span>
                              </span>
                            )}
                            <span className="min-w-0 max-w-full truncate">{m.email}</span>
                          </span>
                        </span>
                        <ChevronRight
                          className="h-5 w-5 flex-shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
            <p className="mt-2 px-1 text-sm text-muted-foreground">
              {isAdmin
                ? "Tap someone for your balance, ways to pay, or admin options."
                : "Tap someone for your balance and ways to pay them."}
            </p>
          </section>

          {/* Settings — admin only */}
          {isAdmin && (
            <section aria-labelledby="household-settings">
              <SectionLabel id="household-settings">Settings</SectionLabel>
              <Card className="space-y-5 p-4">
                <div className="space-y-2">
                  {/* Rename sits on the label's row, so the name below gets
                      the card's full width instead of a squeezed column. */}
                  <div className="flex min-h-6 items-center justify-between gap-3">
                    <Label htmlFor={editingName ? "household-name" : undefined}>
                      Household name
                    </Label>
                    {!editingName && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="-my-2.5 -mr-3 flex-shrink-0 px-3 text-primary hover:text-primary"
                        onClick={() => setEditingName(true)}
                        aria-label="Rename household"
                      >
                        <Pencil aria-hidden /> Rename
                      </Button>
                    )}
                  </div>
                  {editingName ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void saveName();
                      }}
                      className="space-y-3"
                    >
                      <Input
                        id="household-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={80}
                        autoFocus
                        enterKeyHint="done"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" onClick={cancelRename}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={savingName || !name.trim()}>
                          {savingName && <Loader2 className="animate-spin" aria-hidden />}
                          Save
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <p className="break-words text-base font-medium">{household?.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="household-currency">Currency</Label>
                  <Select
                    value={household?.currency ?? "USD"}
                    onValueChange={changeCurrency}
                    disabled={currencyBusy}
                  >
                    <SelectTrigger id="household-currency">
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
                  <p className="text-sm text-muted-foreground">
                    How amounts are shown for everyone. Nothing is converted.
                  </p>
                </div>
              </Card>
            </section>
          )}

          {/* Recent activity */}
          {activityQ.loading && !activityQ.data ? (
            <section aria-busy="true" aria-label="Recent activity">
              <Skeleton className="mb-3 ml-1 h-4 w-28" />
              <Card className="divide-y overflow-hidden">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="hidden h-10 w-10 flex-shrink-0 rounded-xl min-[360px]:block" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-3.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          ) : (
            activity.length > 0 && (
              <section aria-labelledby="household-activity">
                <SectionLabel id="household-activity">Recent activity</SectionLabel>
                <Card className="overflow-hidden">
                  <ul className="divide-y">
                    {visibleActivity.map((a) => {
                      const Icon = ACTIVITY_ICONS[a.action] ?? Activity;
                      return (
                        <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                          {/* The entry already says what happened ("Added…",
                              "Deleted…"), so the icon goes on narrow screens. */}
                          <span className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground min-[360px]:flex">
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-base leading-snug">
                              {a.detail ?? a.action.replace(/_/g, " ")}
                            </p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {a.actorName} · {timeAgo(a.createdAt)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {activity.length > ACTIVITY_PREVIEW && (
                    <button
                      type="button"
                      onClick={() => setShowAllActivity((s) => !s)}
                      aria-expanded={showAllActivity}
                      className="flex min-h-12 w-full items-center justify-center border-t px-4 text-base font-semibold text-primary transition-colors hover:bg-accent active:bg-accent"
                    >
                      {showAllActivity ? "Show less" : `Show all ${activity.length}`}
                    </button>
                  )}
                </Card>
              </section>
            )
          )}

          {/* Leave — anyone who isn't an admin can leave on their own */}
          {me && me.role !== "owner" && (
            <Card className="overflow-hidden">
              <button
                type="button"
                onClick={() => removeMember(me.id, true)}
                disabled={!!busyId}
                className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent active:bg-accent disabled:pointer-events-none disabled:opacity-60"
              >
                <span className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive min-[360px]:flex">
                  {busyId === me.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  ) : (
                    <LogOut className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-base font-semibold text-destructive">
                    {busyId === me.id && (
                      <Loader2 className="h-5 w-5 animate-spin min-[360px]:hidden" aria-hidden />
                    )}
                    Leave household
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    You need to be settled up first.
                  </span>
                </span>
              </button>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>

    <MemberDetailSheet
      member={detail}
      open={detailOpen && detail !== null}
      onOpenChange={(o) => !o && closeDetail()}
      onMakeAdmin={canPromote && detail ? () => makeAdmin(detail.id) : undefined}
      onRemove={
        canRemove && detail ? () => removeMember(detail.id, detailIsSelf) : undefined
      }
    />
    </>
  );
}
