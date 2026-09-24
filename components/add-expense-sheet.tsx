"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ExpenseForm } from "@/components/expense-form";

const Ctx = React.createContext<(() => void) | null>(null);

/** Returns a function that opens the "Add expense" sheet from anywhere in the
 *  signed-in app (the tab bar's + button, the sidebar, empty states…). */
export function useAddExpense(): () => void {
  const open = React.useContext(Ctx);
  if (!open) throw new Error("useAddExpense must be used within <AddExpenseProvider>");
  return open;
}

/** Opens the sheet when the app is launched from the manifest shortcut
 *  (`/home?add=1`), then strips the param so a refresh doesn't reopen it. */
function LaunchShortcut({ onOpen }: { onOpen: () => void }) {
  const params = useSearchParams();
  const router = useRouter();
  React.useEffect(() => {
    if (params.get("add") === "1") {
      onOpen();
      router.replace(window.location.pathname);
    }
  }, [params, router, onOpen]);
  return null;
}

/**
 * Owns the "Add expense" bottom sheet. Children open it through
 * `useAddExpense()` rather than each rendering their own sheet.
 */
export function AddExpenseProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const show = React.useCallback(() => setOpen(true), []);

  return (
    <Ctx.Provider value={show}>
      {children}
      <React.Suspense fallback={null}>
        <LaunchShortcut onOpen={show} />
      </React.Suspense>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
          <SheetHeader className="mb-5">
            <SheetTitle>Add expense</SheetTitle>
            <SheetDescription>
              Split it equally, by exact amounts, or by percentage.
            </SheetDescription>
          </SheetHeader>
          <ExpenseForm onDone={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </Ctx.Provider>
  );
}
