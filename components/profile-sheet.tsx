"use client";

import * as React from "react";
import { AlertCircle, Loader2, Plus, Trash2, Wallet } from "lucide-react";
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
import { useAppData } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import {
  PAYMENT_METHODS,
  type PaymentMethod,
  type PaymentMethodType,
} from "@/lib/types";

const SUPPORTED = new Set(PAYMENT_METHODS.map((p) => p.value));

interface Profile {
  id: string;
  name: string;
  email: string;
  paymentMethods: PaymentMethod[];
}

/** A payment-method row with a stable client key so React keeps input state
 *  associated with the right row when rows are added/removed/reordered. */
interface MethodRow extends PaymentMethod {
  key: number;
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

function FieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

/** Placeholder shaped like the form, shown while the profile loads. */
function ProfileSkeleton() {
  return (
    <div role="status" className="space-y-8">
      <span className="sr-only">Loading your profile…</span>
      <div className="space-y-5">
        <FieldSkeleton />
        <FieldSkeleton />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function ProfileSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { refresh, mutate } = useAppData();
  const { toast } = useToast();
  const profileQ = useFetch<{ profile: Profile }>(open ? "/api/profile" : null);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [methods, setMethods] = React.useState<MethodRow[]>([]);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  // The row just added with "Add a way to pay", so its field gets focus.
  const [focusKey, setFocusKey] = React.useState<number | null>(null);
  const rowKey = React.useRef(0);

  // Hydrate the form once the profile arrives.
  React.useEffect(() => {
    const p = profileQ.data?.profile;
    if (p && !loaded) {
      setName(p.name);
      setEmail(p.email);
      // Only keep currently-supported method types.
      setMethods(
        p.paymentMethods
          .filter((m) => SUPPORTED.has(m.type))
          .map((m) => ({ ...m, key: ++rowKey.current })),
      );
      setLoaded(true);
    }
  }, [profileQ.data, loaded]);

  // Reset when the sheet closes so it re-hydrates fresh next time.
  React.useEffect(() => {
    if (!open) {
      setLoaded(false);
      setCurrentPassword("");
      setNewPassword("");
      setFocusKey(null);
    }
  }, [open]);

  function addMethod() {
    const key = ++rowKey.current;
    setMethods((m) => [...m, { type: "venmo", value: "", key }]);
    setFocusKey(key);
  }
  function updateMethod(i: number, patch: Partial<PaymentMethod>) {
    setMethods((m) => m.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeMethod(i: number) {
    setMethods((m) => m.filter((_, idx) => idx !== i));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cleanMethods = methods
      .map((m) => ({ type: m.type, value: m.value.trim() }))
      .filter((m) => m.value.length > 0);

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          paymentMethods: cleanMethods,
          ...(newPassword
            ? { currentPassword, newPassword }
            : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: data.error || "Could not save profile", variant: "error" });
        return;
      }
      toast({ title: "Profile saved", variant: "success" });
      mutate();
      await refresh();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Your profile</SheetTitle>
          <SheetDescription>
            Update your details and how roommates can pay you.
          </SheetDescription>
        </SheetHeader>

        {!loaded ? (
          profileQ.error && !profileQ.data ? (
            <Card role="alert" className="flex flex-col items-center px-6 py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-negative-soft text-negative">
                <AlertCircle className="h-7 w-7" aria-hidden />
              </span>
              <p className="mt-4 text-lg font-semibold">Couldn&apos;t load your profile</p>
              <p className="mt-1 max-w-xs text-balance text-sm text-muted-foreground">
                Check your connection and try again.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-5 px-6"
                onClick={() => void profileQ.refetch()}
              >
                Try again
              </Button>
            </Card>
          ) : (
            <ProfileSkeleton />
          )
        ) : (
          <form onSubmit={save} className="space-y-8">
            {/* Name and email */}
            <section aria-label="Your details" className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pname">Name</Label>
                <Input
                  id="pname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={80}
                  autoComplete="name"
                  enterKeyHint="next"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pemail">Email</Label>
                <Input
                  id="pemail"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </div>
            </section>

            {/* Ways to pay */}
            <section aria-labelledby="profile-ways-to-pay" className="space-y-3">
              <div className="space-y-1">
                <SectionTitle id="profile-ways-to-pay">Ways to pay me</SectionTitle>
                <p className="text-sm text-muted-foreground">
                  Shown to roommates when they owe you, so they know how to pay.
                </p>
              </div>
              <Card className="overflow-hidden">
                {methods.length === 0 ? (
                  <div className="flex items-center gap-3 px-4 py-4">
                    <span className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground min-[360px]:flex">
                      <Wallet className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="min-w-0 text-sm text-muted-foreground">
                      None yet. Add Venmo, Cash App, Zelle and more.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {methods.map((m, i) => {
                      const def = PAYMENT_METHODS.find((p) => p.value === m.type);
                      const label = def?.label ?? m.type;
                      return (
                        <li key={m.key} className="space-y-3 p-3 min-[360px]:p-4">
                          <div className="flex gap-2">
                            <Select
                              value={m.type}
                              onValueChange={(v) =>
                                updateMethod(i, { type: v as PaymentMethodType })
                              }
                            >
                              <SelectTrigger
                                className="min-w-0 flex-1"
                                aria-label="Payment app"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PAYMENT_METHODS.map((p) => (
                                  <SelectItem key={p.value} value={p.value}>
                                    {p.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => removeMethod(i)}
                              aria-label={`Remove ${label}`}
                              className="h-12 w-12 flex-shrink-0 px-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 aria-hidden />
                            </Button>
                          </div>
                          <Input
                            value={m.value}
                            onChange={(e) => updateMethod(i, { value: e.target.value })}
                            placeholder={def?.placeholder}
                            maxLength={200}
                            aria-label={`${label} handle`}
                            autoFocus={m.key === focusKey}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={addMethod}
                  className="flex min-h-14 w-full items-center gap-3 border-t px-4 py-3 text-left text-base font-semibold text-primary transition-colors hover:bg-accent active:bg-accent"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Plus className="h-5 w-5" aria-hidden />
                  </span>
                  Add a way to pay
                </button>
              </Card>
            </section>

            {/* Optional password change */}
            <section aria-labelledby="profile-password" className="space-y-5">
              <div className="space-y-1">
                <SectionTitle id="profile-password">Change password</SectionTitle>
                <p className="text-sm text-muted-foreground">
                  Optional. Leave both blank to keep your current one.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pcurrent">Current password</Label>
                <Input
                  id="pcurrent"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pnew">New password</Label>
                <Input
                  id="pnew"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </section>

            <Button type="submit" className="w-full" size="lg" disabled={saving}>
              {saving && <Loader2 className="animate-spin" aria-hidden />}
              Save profile
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
