"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronDown, Loader2 } from "lucide-react";
import { BottomNav, Sidebar } from "@/components/bottom-nav";
import { OfflineBanner } from "@/components/offline-banner";
import { AddExpenseProvider } from "@/components/add-expense-sheet";
import { AppDataProvider, useAppData } from "@/components/app-data";
import { HouseholdSetup } from "@/components/household-setup";
import { ManageHouseholdSheet } from "@/components/manage-household-sheet";
import { ProfileSheet } from "@/components/profile-sheet";
import { AdsAdminSheet } from "@/components/ads-admin-sheet";
import { AccountSheet } from "@/components/account-sheet";
import { MemberAvatar } from "@/components/member-avatar";
import { InstallPrompt } from "@/components/install-prompt";

/**
 * The top bar holds exactly two controls — the household (tap to manage it)
 * and your avatar (tap for profile, theme, log out) — so it fits a 320px
 * phone without squeezing, instead of the old row of five unlabeled icons.
 */
function TopBar() {
  const { household, members, currentUserId } = useAppData();
  const me = members.find((m) => m.id === currentUserId);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [manageOpen, setManageOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [adsOpen, setAdsOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-lg safe-top supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 w-full max-w-lg items-center gap-2 px-gutter md:max-w-none">
        <button
          type="button"
          onClick={() => setManageOpen(true)}
          className="-ml-2 flex h-11 min-w-0 items-center gap-2 rounded-xl px-2 text-left transition-colors hover:bg-accent active:bg-accent"
          aria-label={`Household: ${household?.name ?? ""}. Manage household`}
        >
          <Image
            src="/icons/icon-192.png"
            alt=""
            aria-hidden
            width={28}
            height={28}
            className="flex-shrink-0 rounded-lg md:hidden"
          />
          <span className="truncate text-base font-semibold">
            {household?.name ?? "BillSpilt"}
          </span>
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setAccountOpen(true)}
          aria-label="Account and settings"
          className="-mr-1.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-accent"
        >
          {me ? (
            <MemberAvatar id={me.id} name={me.name} className="h-9 w-9" />
          ) : (
            <span className="h-9 w-9 rounded-full bg-muted" />
          )}
        </button>
      </div>
      <AccountSheet
        open={accountOpen}
        onOpenChange={setAccountOpen}
        onProfile={() => setProfileOpen(true)}
        onHousehold={() => setManageOpen(true)}
        onAds={() => setAdsOpen(true)}
      />
      <ManageHouseholdSheet open={manageOpen} onOpenChange={setManageOpen} />
      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
      <AdsAdminSheet open={adsOpen} onOpenChange={setAdsOpen} />
    </header>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { loading, needsSetup } = useAppData();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (needsSetup) {
    return <HouseholdSetup />;
  }

  return (
    <AddExpenseProvider>
      <div data-app-shell className="flex min-h-[100dvh] flex-col">
        <OfflineBanner />
        <div className="mx-auto flex w-full max-w-6xl flex-1">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            {/* Bottom padding clears the fixed tab bar plus the home
                indicator, with room to scroll the last card fully into view. */}
            <main className="flex-1 px-gutter pb-[calc(theme(spacing.tabbar)+env(safe-area-inset-bottom)+1.5rem)] pt-5 md:pb-12 md:pt-8">
              <div className="mx-auto w-full max-w-lg">{children}</div>
            </main>
          </div>
        </div>
        <BottomNav />
        <InstallPrompt />
        {/* No ad code runs inside the authenticated app: it's a functional tool,
            and AdSense policy forbids ads on "screens without publisher content."
            Ads live only on the public content pages (landing, guides, About,
            Contact) via <AdSenseScript />. */}
      </div>
    </AddExpenseProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <Shell>{children}</Shell>
    </AppDataProvider>
  );
}
