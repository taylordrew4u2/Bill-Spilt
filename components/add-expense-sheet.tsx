"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ExpenseForm } from "@/components/expense-form";

/**
 * Floating action button that opens the "Add Expense" bottom sheet. Also opens
 * automatically when the app is launched via the manifest shortcut (?add=1).
 */
export function AddExpenseSheet() {
  const [open, setOpen] = React.useState(false);
  const params = useSearchParams();
  const router = useRouter();

  React.useEffect(() => {
    if (params.get("add") === "1") {
      setOpen(true);
      router.replace(window.location.pathname);
    }
  }, [params, router]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Add expense"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-95 md:bottom-8"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle>Add expense</SheetTitle>
            <SheetDescription>
              Split it equally, by exact amounts, or by percentage.
            </SheetDescription>
          </SheetHeader>
          <ExpenseForm onDone={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
