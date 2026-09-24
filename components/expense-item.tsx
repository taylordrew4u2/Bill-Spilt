"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Trash2, Paperclip, Package } from "lucide-react";
import { useMoney } from "@/components/app-data";
import { CATEGORIES, type Expense } from "@/lib/types";

/** Swipe distances, in phone pixels at the default 16px root size. */
const DELETE_THRESHOLD = -96;
const DRAG_LIMIT = -160;

/**
 * How many CSS px make one "phone" px. 1 normally; larger when the root font
 * is scaled up — by the desktop-mode phone fix (lib/viewport-fix.ts), where a
 * CSS px is ~0.4 screen px, or by the user's own text-size setting — so a
 * swipe has to travel the same physical distance to delete.
 */
function pxScale(): number {
  if (typeof window === "undefined") return 1;
  const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return root > 0 ? root / 16 : 1;
}

/**
 * A single expense row with swipe-to-delete (drag left to reveal/confirm
 * delete). Powered by framer-motion drag. Tapping the row opens its details
 * (split, receipt, edit and delete).
 */
export function ExpenseItem({
  expense,
  currentUserId,
  onDelete,
  onOpen,
}: {
  expense: Expense;
  currentUserId: string | null;
  onDelete: (id: string) => void;
  onOpen?: (expense: Expense) => void;
}) {
  const money = useMoney();
  const x = useMotionValue(0);
  const [removing, setRemoving] = React.useState(false);
  // Track whether the pointer moved (a drag) so a swipe doesn't also fire tap.
  const draggedRef = React.useRef(false);
  const cat = CATEGORIES.find((c) => c.value === expense.category);
  const CatIcon = cat?.icon ?? Package;

  const [scale, setScale] = React.useState(1);
  React.useEffect(() => setScale(pxScale()), []);
  const threshold = DELETE_THRESHOLD * scale;

  // Reveal the red delete affordance as the user drags left.
  const bgOpacity = useTransform(x, (v) => Math.min(1, Math.max(0, v / threshold)));

  function handleDragEnd() {
    if (x.get() <= threshold) {
      setRemoving(true);
      // Animate off-screen, then commit the delete.
      animate(x, -window.innerWidth, {
        duration: 0.2,
        onComplete: () => onDelete(expense.id),
      });
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
    }
    // Clear the drag flag after the click that may follow this drag has fired,
    // so a drag never permanently swallows the next genuine tap.
    setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  }

  function open() {
    if (draggedRef.current) return; // a drag/swipe, not a tap
    onOpen?.(expense);
  }

  const yourShare = expense.splits.find((s) => s.userId === currentUserId);
  const paidByYou = expense.paidBy === currentUserId;

  return (
    <motion.div
      layout
      initial={false}
      animate={{ height: removing ? 0 : "auto", opacity: removing ? 0 : 1 }}
      className="relative overflow-hidden"
    >
      {/* Delete background */}
      <motion.div
        aria-hidden
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 flex items-center justify-end gap-2 bg-destructive pr-5 text-sm font-semibold text-destructive-foreground"
      >
        <Trash2 className="h-5 w-5" />
        Delete
      </motion.div>

      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: DRAG_LIMIT * scale, right: 0 }}
        dragElastic={0.05}
        onDragStart={() => {
          draggedRef.current = true;
        }}
        onDragEnd={handleDragEnd}
        onClick={onOpen ? open : undefined}
        onKeyDown={
          onOpen
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen(expense);
                }
              }
            : undefined
        }
        role={onOpen ? "button" : undefined}
        tabIndex={onOpen ? 0 : undefined}
        className="relative flex min-h-14 cursor-pointer touch-pan-y items-center gap-3 bg-card px-3 py-3.5 transition-colors xs:px-4 [@media(hover:hover)]:hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-accent"
      >
        {/* The category tile is decoration; on the narrowest screens (small
            phones, large text settings) its width goes to the description. */}
        <div className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary xs:flex">
          <CatIcon className="h-5 w-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          {/* The description gets the whole line except the amount, and may
              wrap to two lines rather than truncate to a few characters. A
              wide amount (e.g. "CHF 12,345.67" on a 320px phone) drops onto
              its own line instead of squeezing the description. */}
          <div className="flex flex-wrap items-start justify-end gap-x-3">
            <p className="line-clamp-2 min-w-0 grow basis-24 break-words text-base font-medium leading-snug">
              {expense.description}
            </p>
            <p className="flex-shrink-0 whitespace-nowrap text-base font-semibold leading-snug tabular-nums">
              {money(expense.amount)}
            </p>
          </div>

          {/* One line of plain inline text that wraps at word boundaries,
              rather than separate flex columns that each stack on their own. */}
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {expense.receiptUrl && (
              <>
                <Paperclip className="-mt-0.5 mr-1 inline h-4 w-4 align-middle" aria-hidden />
                <span className="sr-only">Receipt attached. </span>
              </>
            )}
            {paidByYou ? "You" : expense.paidByName} paid
            {yourShare && (
              <>
                <span aria-hidden> · </span>
                <span className="whitespace-nowrap">
                  your share{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {money(yourShare.amount)}
                  </span>
                </span>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
