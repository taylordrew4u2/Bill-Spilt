"use client";

import * as React from "react";
import { Crown, Bell, ArrowUpRight, ArrowDownRight, Check, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MemberAvatar } from "@/components/member-avatar";
import { PaymentMethodsList } from "@/components/payment-methods-list";
import { useToast } from "@/components/ui/toaster";
import { useAppData } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import { formatCurrency, colorForId } from "@/lib/utils";
import { PAYMENT_METHODS, type Member } from "@/lib/types";

export function MemberDetailSheet({
  member,
  open,
  onOpenChange,
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { currentUserId, members, version } = useAppData();
  const { toast } = useToast();
  const isSelf = member?.id === currentUserId;

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
      `Hey ${member.name}, friendly reminder you owe me ${formatCurrency(amount)} on Bill Spilt.` +
      (ways ? ` You can pay me with ${ways}.` : "");
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Bill Spilt reminder", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast({ title: "Reminder copied", description: "Paste it to send.", variant: "success" });
    } catch {
      /* dismissed / unavailable */
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        <SheetHeader className="mb-1">
          <div className="flex items-center gap-3">
            <MemberAvatar id={member.id} name={member.name} className="h-12 w-12" />
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2">
                <span className="truncate">{member.name}</span>
                {member.role === "owner" && (
                  <Badge variant="secondary" className="gap-1">
                    <Crown className="h-3 w-3" /> Admin
                  </Badge>
                )}
              </SheetTitle>
              <p className="truncate text-sm text-muted-foreground">{member.email}</p>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        {/* Balance with you */}
        {isSelf ? (
          <p className="py-2 text-center text-sm text-muted-foreground">
            This is you.
          </p>
        ) : balanceQ.loading && !balanceQ.data ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div
            className="flex items-center gap-3 rounded-xl p-4"
            style={{
              backgroundColor: theyOweYou
                ? "rgb(16 185 129 / 0.1)"
                : youOwe
                  ? "rgb(244 63 94 / 0.1)"
                  : undefined,
            }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: colorForId(member.id) }}
            >
              {theyOweYou ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : youOwe ? (
                <ArrowDownRight className="h-5 w-5" />
              ) : (
                <Check className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {theyOweYou
                  ? `${member.name} owes you`
                  : youOwe
                    ? `You owe ${member.name}`
                    : "You're settled up"}
              </p>
              {(theyOweYou || youOwe) && (
                <p className="text-xl font-bold">{formatCurrency(amount)}</p>
              )}
            </div>
            {theyOweYou && (
              <Button variant="outline" size="sm" onClick={remind}>
                <Bell className="h-4 w-4" /> Remind
              </Button>
            )}
          </div>
        )}

        {/* Ways to pay */}
        {member.paymentMethods.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {isSelf ? "Your ways to pay" : `Pay ${member.name} with`}
            </p>
            <PaymentMethodsList
              methods={member.paymentMethods}
              linkContext={
                youOwe
                  ? {
                      amount,
                      note: myName ? `Bill Spilt — from ${myName}` : "Bill Spilt",
                    }
                  : undefined
              }
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
