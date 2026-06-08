"use client";

import * as React from "react";
import { Loader2, Copy, Check, Crown, UserMinus, LogOut, Pencil, ShieldPlus } from "lucide-react";
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
import { MemberAvatar } from "@/components/member-avatar";
import { useToast } from "@/components/ui/toaster";
import { useAppData } from "@/components/app-data";

export function ManageHouseholdSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { household, members, currentUserId, isAdmin, refresh, mutate } =
    useAppData();
  const { toast } = useToast();

  const [editingName, setEditingName] = React.useState(false);
  const [name, setName] = React.useState(household?.name ?? "");
  const [savingName, setSavingName] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

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

  async function makeAdmin(userId: string) {
    const who = members.find((m) => m.id === userId)?.name ?? "this member";
    if (!window.confirm(`Make ${who} the admin? You'll become a regular member.`)) {
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
      toast({ title: `${who} is now the admin`, variant: "success" });
      mutate();
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function copyCode() {
    if (!household) return;
    try {
      await navigator.clipboard.writeText(household.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: household.inviteCode });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        <SheetHeader className="mb-4">
          <SheetTitle>Manage household</SheetTitle>
          <SheetDescription>
            {isAdmin
              ? "You're the admin — rename the household or manage members."
              : "View members and your invite code."}
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

        {/* Invite code */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Invite code
            </p>
            <p className="text-xl font-bold tracking-[0.25em]">
              {household?.inviteCode}
            </p>
          </div>
          <Button variant="outline" onClick={copyCode}>
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Members */}
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Members ({members.length})
        </p>
        <ul className="divide-y">
          {members.map((m) => {
            const isSelf = m.id === currentUserId;
            const canRemove =
              m.role !== "owner" && (isAdmin || isSelf) && !busyId;
            return (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
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
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
