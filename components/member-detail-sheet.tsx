"use client";

import * as React from "react";
import {
  Bell,
  Check,
  Crown,
  Loader2,
  LogOut,
  ShieldPlus,
  UserMinus,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberAvatar } from "@/components/member-avatar";
import { PaymentMethodsList } from "@/components/payment-methods-list";
import { useToast } from "@/components/ui/toaster";
import { useAppData, useMoney } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import { cn } from "@/lib/utils";
import { PAYMENT_METHODS, type Member } from "@/lib/types";

function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
      {children}
    </h3>
  );
}

/** A labeled, full-width action row: icon tile, title, one-line explanation. */
function ActionRow({
  icon: Icon,
  label,
  hint,
  onClick,
  busy,
  disabled,
  destructive,
}: {
  icon: typeof Bell;
  label: string;
  hint: string;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent active:bg-accent disabled:pointer-events-none disabled:opacity-60"
    >
      {/* The tile is hidden on the narrowest screens so the label and hint
          get the full row; the busy spinner then sits beside the label. */}
      <span
        className={cn(
          "hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl min-[360px]:flex",
          destructive
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary",
        )}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <Icon className="h-5 w-5" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "flex items-center gap-2 text-base font-semibold",
            destructive && "text-destructive",
          )}
        >
          {busy && (
            <Loader2 className="h-5 w-5 animate-spin min-[360px]:hidden" aria-hidden />
          )}
          {label}
        </span>
        <span className="block text-sm text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}

export function MemberDetailSheet({
  member,
  open,
  onOpenChange,
  onMakeAdmin,
  onRemove,
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Promote this member to admin. Omit to hide the action. */
  onMakeAdmin?: () => void | Promise<void>;
  /** Remove this member — or leave, when it's you. Omit to hide the action. */
  onRemove?: () => void | Promise<void>;
}) {
  const { currentUserId, members, version } = useAppData();
  const money = useMoney();
  const { toast } = useToast();
  const isSelf = member?.id === currentUserId;
  const [running, setRunning] = React.useState<"admin" | "remove" | null>(null);

  // Pairwise balance: net > 0 → they owe you, < 0 → you owe them.
  const balanceQ = useFetch<{ net: number }>(
    open && member && !isSelf ? `/api/members/${member.id}/balance` : null,
  );
  const refetchBalance = balanceQ.refetch;
  React.useEffect(() => {
    if (open && member && !isSelf) void refetchBalance();
  }, [open, member, isSelf, version, refetchBalance]);

  if (!member) return null;

  const net = balanceQ.data?.net ?? 0;
  const theyOweYou = net > 0.005;
  const youOwe = net < -0.005;
  const amount = Math.abs(net);
  const myName = members.find((m) => m.id === currentUserId)?.name;

  async function remind() {
    if (!member) return;
    const ways = member.paymentMethods
      .map((pm) => {
        const def = PAYMENT_METHODS.find((p) => p.value === pm.type);
        return `${def?.label ?? pm.type} ${pm.value}`;
      })
      .join(", ");
    const text =
      `Hey ${member.name}, friendly reminder you owe me ${money(amount)} on BillSpilt.` +
      (ways ? ` You can pay me with ${ways}.` : "");
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "BillSpilt reminder", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast({ title: "Reminder copied", description: "Paste it to send.", variant: "success" });
    } catch {
      /* dismissed / unavailable */
    }
  }

  async function run(kind: "admin" | "remove", fn: () => void | Promise<void>) {
    setRunning(kind);
    try {
      await fn();
    } finally {
      setRunning(null);
    }
  }

  const hasMethods = member.paymentMethods.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        {/* A centered contact card: the avatar sits clear of the close
            button, so the name below gets the sheet's full width. */}
        <SheetHeader className="mb-6 items-center pr-0 text-center">
          <MemberAvatar
            id={member.id}
            name={member.name}
            className="h-16 w-16 [&>span]:text-xl"
          />
          <div className="mt-2 w-full min-w-0">
            <SheetTitle className="line-clamp-2 break-words leading-tight">
              {member.name}
            </SheetTitle>
            <SheetDescription className="mt-0.5 break-words">{member.email}</SheetDescription>
            {(member.role === "owner" || isSelf) && (
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {member.role === "owner" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <Crown className="h-3.5 w-3.5" aria-hidden /> Admin
                  </span>
                )}
                {isSelf && (
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    You
                  </span>
                )}
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Balance with you — there's none with yourself; the "You" badge
              and the note under your ways to pay cover that case. */}
          {isSelf ? null : balanceQ.loading && !balanceQ.data ? (
            <Card role="status" className="p-4">
              <span className="sr-only">Loading balance…</span>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-3 h-10 w-36" />
            </Card>
          ) : theyOweYou || youOwe ? (
            <Card
              className={cn(
                "border-transparent p-4",
                theyOweYou ? "bg-positive-soft" : "bg-negative-soft",
              )}
            >
              <p className="text-sm font-medium text-muted-foreground">
                {/* The name is right above in the header. */}
                {theyOweYou ? "Owes you" : "You owe"}
              </p>
              <p
                className={cn(
                  "mt-1 text-4xl font-bold tabular-nums tracking-tight",
                  theyOweYou ? "text-positive" : "text-negative",
                )}
              >
                {money(amount)}
              </p>
              {theyOweYou && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={remind}
                >
                  <Bell aria-hidden /> Send a reminder
                </Button>
              )}
              {youOwe && hasMethods && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Pay with one of the options below.
                </p>
              )}
            </Card>
          ) : (
            <Card className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-positive-soft text-positive">
                <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold">You&apos;re settled up</p>
                <p className="text-sm text-muted-foreground">
                  Nothing owed either way.
                </p>
              </div>
            </Card>
          )}

          {/* Ways to pay */}
          <section aria-labelledby="member-ways-to-pay">
            <SectionLabel id="member-ways-to-pay">
              {isSelf ? "Your ways to pay" : "Ways to pay"}
            </SectionLabel>
            {hasMethods ? (
              <Card className="px-3 py-1 min-[360px]:px-4">
                <PaymentMethodsList
                  methods={member.paymentMethods}
                  linkContext={
                    youOwe
                      ? {
                          amount,
                          note: myName ? `BillSpilt — from ${myName}` : "BillSpilt",
                        }
                      : undefined
                  }
                />
              </Card>
            ) : (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">
                  {isSelf
                    ? "You haven't added any ways to pay yet."
                    : `${member.name} hasn't added any ways to pay yet.`}
                </p>
              </Card>
            )}
            {isSelf && (
              <p className="mt-2 px-1 text-sm text-muted-foreground">
                Edit your details and ways to pay from Profile in the account menu.
              </p>
            )}
          </section>

          {/* Admin / membership actions, when the caller allows them */}
          {(onMakeAdmin || onRemove) && (
            <section aria-labelledby="member-manage">
              <SectionLabel id="member-manage">
                {isSelf ? "Membership" : "Manage"}
              </SectionLabel>
              <Card className="divide-y overflow-hidden">
                {onMakeAdmin && (
                  <ActionRow
                    icon={ShieldPlus}
                    label="Make admin"
                    hint="Admins can change settings, invite and remove people."
                    busy={running === "admin"}
                    disabled={running !== null}
                    onClick={() => void run("admin", onMakeAdmin)}
                  />
                )}
                {onRemove && (
                  <ActionRow
                    icon={isSelf ? LogOut : UserMinus}
                    label={isSelf ? "Leave household" : "Remove from household"}
                    hint={
                      isSelf
                        ? "You need to be settled up first."
                        : "They need to be settled up first."
                    }
                    destructive
                    busy={running === "remove"}
                    disabled={running !== null}
                    onClick={() => void run("remove", onRemove)}
                  />
                )}
              </Card>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
