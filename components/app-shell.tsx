"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { Brand } from "@/components/brand";
import { BottomNav, Sidebar } from "@/components/bottom-nav";
import { OfflineBanner } from "@/components/offline-banner";
import { AddExpenseSheet } from "@/components/add-expense-sheet";
import { AppDataProvider, useAppData } from "@/components/app-data";
import { HouseholdSetup } from "@/components/household-setup";
import { ThemeToggle } from "@/components/theme-toggle";

function Header() {
  const { household } = useAppData();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-top">
      <div className="flex flex-col">
        <Brand size="sm" />
        {household && (
          <span className="mt-0.5 pl-9 text-xs text-muted-foreground">
            {household.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Log out"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { loading, needsSetup } = useAppData();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needsSetup) {
    return <HouseholdSetup />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <OfflineBanner />
      <div className="mx-auto flex w-full max-w-5xl flex-1 md:gap-0">
        <Sidebar />
        <div className="flex w-full flex-1 flex-col">
          <Header />
          <main className="flex-1 px-4 pb-28 pt-4 md:pb-12">
            <div className="mx-auto w-full max-w-lg">{children}</div>
          </main>
        </div>
      </div>
      <BottomNav />
      <React.Suspense fallback={null}>
        <AddExpenseSheet />
      </React.Suspense>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <Shell>{children}</Shell>
    </AppDataProvider>
  );
}
