"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Scale, PieChart, Plus } from "lucide-react";
import { Brand } from "@/components/brand";
import { useAddExpense } from "@/components/add-expense-sheet";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/settle", label: "Settle", icon: Scale },
  { href: "/stats", label: "Stats", icon: PieChart },
];

function Tab({
  tab,
  active,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
}) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-full min-w-0 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
          active && "bg-primary/15",
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 2} aria-hidden />
      </span>
      <span className="max-w-full truncate px-0.5">{tab.label}</span>
    </Link>
  );
}

/**
 * The phone tab bar: four destinations with the primary action — adding an
 * expense — in the middle, where a thumb rests. Every cell is the full bar
 * height (68px), well past the 44px touch minimum.
 */
export function BottomNav() {
  const pathname = usePathname();
  const addExpense = useAddExpense();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/85 md:hidden"
    >
      <ul className="mx-auto grid h-tabbar max-w-lg grid-cols-5 items-stretch pb-[env(safe-area-inset-bottom)] box-content">
        {TABS.slice(0, 2).map((tab) => (
          <li key={tab.href} className="min-w-0">
            <Tab tab={tab} active={pathname === tab.href} />
          </li>
        ))}
        <li className="flex items-center justify-center">
          <button
            type="button"
            onClick={addExpense}
            aria-label="Add expense"
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} aria-hidden />
          </button>
        </li>
        {TABS.slice(2).map((tab) => (
          <li key={tab.href} className="min-w-0">
            <Tab tab={tab} active={pathname === tab.href} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Desktop sidebar (md and up): brand, the same destinations, and the add
 *  action as a full-width button. */
export function Sidebar() {
  const pathname = usePathname();
  const addExpense = useAddExpense();
  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-64 flex-shrink-0 flex-col gap-6 border-r px-4 py-6 md:flex">
      <Brand size="sm" className="px-2" />
      <button
        type="button"
        onClick={addExpense}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition active:scale-[0.98]"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        Add expense
      </button>
      <nav aria-label="Main">
        <ul className="space-y-1">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
