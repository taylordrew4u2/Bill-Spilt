"use client";

import * as React from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
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

interface Profile {
  id: string;
  name: string;
  email: string;
  paymentMethods: PaymentMethod[];
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
  const [methods, setMethods] = React.useState<PaymentMethod[]>([]);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  // Hydrate the form once the profile arrives.
  React.useEffect(() => {
    const p = profileQ.data?.profile;
    if (p && !loaded) {
      setName(p.name);
      setEmail(p.email);
      setMethods(p.paymentMethods);
      setLoaded(true);
    }
  }, [profileQ.data, loaded]);

  // Reset when the sheet closes so it re-hydrates fresh next time.
  React.useEffect(() => {
    if (!open) {
      setLoaded(false);
      setCurrentPassword("");
      setNewPassword("");
    }
  }, [open]);

  function addMethod() {
    setMethods((m) => [...m, { type: "venmo", value: "" }]);
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
      .map((m) => ({ ...m, value: m.value.trim() }))
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
        <SheetHeader className="mb-4">
          <SheetTitle>Your profile</SheetTitle>
          <SheetDescription>
            Update your details and how roommates can pay you.
          </SheetDescription>
        </SheetHeader>

        {!loaded ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={save} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="pname">Name</Label>
              <Input
                id="pname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pemail">Email</Label>
              <Input
                id="pemail"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Separator />

            {/* Ways to pay */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ways to pay me</Label>
                <Button type="button" size="sm" variant="outline" onClick={addMethod}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Shown to roommates when they owe you, so they know how to pay.
              </p>
              {methods.length === 0 && (
                <p className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
                  No payment methods yet.
                </p>
              )}
              <ul className="space-y-2">
                {methods.map((m, i) => {
                  const def = PAYMENT_METHODS.find((p) => p.value === m.type);
                  return (
                    <li key={i} className="flex items-center gap-2">
                      <Select
                        value={m.type}
                        onValueChange={(v) =>
                          updateMethod(i, { type: v as PaymentMethodType })
                        }
                      >
                        <SelectTrigger className="w-32 flex-shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.emoji} {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={m.value}
                        onChange={(e) => updateMethod(i, { value: e.target.value })}
                        placeholder={def?.placeholder}
                        maxLength={200}
                      />
                      <button
                        type="button"
                        onClick={() => removeMethod(i)}
                        aria-label="Remove payment method"
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Separator />

            {/* Optional password change */}
            <div className="space-y-2">
              <Label>Change password</Label>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="New password (min 8 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save profile
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
