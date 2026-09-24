"use client";

import * as React from "react";
import {
  AlertCircle,
  Check,
  Plus,
  Receipt,
  Share2,
  UserPlus,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import {
  NetSummary,
  NetSummarySkeleton,
  BalanceRow,
  BalanceRowSkeleton,
} from "@/components/balance-card";
import { AdArea } from "@/components/ad-area";
import { useAddExpense } from "@/components/add-expense-sheet";
import { useAppData } from "@/components/app-data";
import { useFetch } from "@/lib/use-fetch";
import { useToast } from "@/components/ui/toaster";
import { shareInvite } from "@/lib/utils";
import type { Balance } from "@/lib/types";

/** iOS-style grouped-list label that sits above a card. */
function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
      {children}
    </h2>
  );
}

function LoadingState() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading balances…</span>
      <NetSummarySkeleton />
      <div>
        <Skeleton className="mb-3 ml-1 mt-1 h-4 w-20" />
        <Card>
          <ul className="divide-y" aria-hidden>
            {[0, 1, 2].map((i) => (
              <BalanceRowSkeleton key={i} />
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/** Nobody owes anything: a brand-new household, or everyone has settled. */
function SquareState({ solo, onAdd }: { solo: boolean; onAdd: () => void }) {
  const Icon = solo ? Users : Receipt;
  return (
    <Card className="flex flex-col items-center px-6 py-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold">
        {solo ? "It's just you so far" : "Nothing to settle"}
      </h2>
      <p className="mt-1 max-w-xs text-balance text-sm text-muted-foreground">
        {solo
          ? "Invite your roommates below, then add a bill to split it."
          : "Everyone's square. Add a shared bill and we'll work out who owes whom."}
      </p>
      <Button type="button" onClick={onAdd} className="mt-5 px-6">
        <Plus aria-hidden />
        Add expense
      </Button>
    </Card>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card role="alert" className="flex flex-col items-center px-6 py-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-negative-soft text-negative">
        <AlertCircle className="h-7 w-7" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold">Couldn&apos;t load balances</h2>
      <p className="mt-1 max-w-xs text-balance text-sm text-muted-foreground">
        Check your connection and try again.
      </p>
      <Button type="button" variant="outline" onClick={onRetry} className="mt-5 px-6">
        Try again
      </Button>
    </Card>
  );
}

function InviteCard({
  code,
  copied,
  onShare,
}: {
  code: string;
  copied: boolean;
  onShare: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserPlus className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-snug">Invite roommates</h2>
          <p className="mt-0.5 text-balance text-sm text-muted-foreground">
            Send them a join link, or this code.
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <p className="flex h-11 min-w-0 flex-1 items-center justify-center rounded-xl border border-dashed border-input bg-background px-3 text-base font-semibold tabular-nums tracking-widest">
          <span className="sr-only">Invite code: </span>
          <span className="select-all">{code}</span>
        </p>
        <Button type="button" size="sm" onClick={onShare} className="flex-shrink-0">
          {copied ? (
            <>
              <Check aria-hidden /> Copied
            </>
          ) : (
            <>
              <Share2 aria-hidden /> Share link
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

export default function HomePage() {
  const { currentUserId, household, members, version } = useAppData();
  const addExpense = useAddExpense();
  const { toast } = useToast();
  const { data, loading, error, refetch } = useFetch<{ balances: Balance[] }>(
    "/api/balances",
  );
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    void refetch();
  }, [version, refetch]);

  const balances = data?.balances ?? [];
  const mine = balances.find((b) => b.userId === currentUserId);
  const everyoneSquare = balances.every((b) => Math.abs(b.net) <= 0.005);
  const firstName = members
    .find((m) => m.id === currentUserId)
    ?.name.trim()
    .split(/\s+/)[0];

  async function share() {
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
    <div className="duration-500 animate-in fade-in slide-in-from-bottom-3">
      <PageHeader
        title={firstName ? `Hi, ${firstName}` : "Home"}
        subtitle="Here's where things stand."
      />

      <div className="space-y-6">
        {loading && !data ? (
          <LoadingState />
        ) : error && !data ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : everyoneSquare ? (
          <SquareState solo={balances.length <= 1} onAdd={addExpense} />
        ) : (
          <>
            <NetSummary net={mine?.net ?? 0} />
            <section aria-labelledby="home-balances">
              <SectionLabel id="home-balances">Balances</SectionLabel>
              <Card>
                <ul className="divide-y">
                  {balances.map((b) => (
                    <BalanceRow
                      key={b.userId}
                      balance={b}
                      isCurrentUser={b.userId === currentUserId}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          </>
        )}

        {household && (
          <InviteCard
            code={household.inviteCode}
            copied={copied}
            onShare={share}
          />
        )}

        {/* Self-served house ads only — the AdSense loader script never runs
            inside the authenticated app, so this can never render a Google
            network unit here even if a slot id is configured. */}
        <AdArea placement="home" />
      </div>
    </div>
  );
}
