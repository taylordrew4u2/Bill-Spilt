"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Trash2, Paperclip, Package } from "lucide-react";
import { useMoney } from "@/components/app-data";
import { CATEGORIES, type Expense } from "@/lib/types";
import { cn } from "@/lib/utils";

const DELETE_THRESHOLD = -96;

/**
 * One piece of a row's secondary line. Pieces wrap onto a new line when they
 * don't fit (so "your share" drops below the payer on a 320px phone instead of
 * squeezing the description), and the leading "·" of whichever piece starts a
 * line is clipped off by the parent's negative margin + overflow-hidden.
 */
function MetaPart({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 max-w-full items-center", className)}>
      <span aria-hidden className="w-4 flex-shrink-0 text-center">
        ·
      </span>
      {children}
    </span>
  );
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

  // Reveal the red delete affordance as the user drags left.
  const bgOpacity = useTransform(x, [DELETE_THRESHOLD, 0], [1, 0]);

  function handleDragEnd() {
    if (x.get() <= DELETE_THRESHOLD) {
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
        dragConstraints={{ left: -160, right: 0 }}
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
        className="relative flex min-h-14 cursor-pointer touch-pan-y items-center gap-3 bg-card px-4 py-3 transition-colors [@media(hover:hover)]:hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-accent"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CatIcon className="h-5 w-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          {/* The description gets the whole line except the amount, and may
              wrap to two lines rather than truncate to a few characters. */}
          <div className="flex items-start gap-3">
            <p className="line-clamp-2 min-w-0 flex-1 text-base font-medium leading-snug">
              {expense.description}
            </p>
            <p className="flex-shrink-0 whitespace-nowrap text-base font-semibold leading-snug tabular-nums">
              {money(expense.amount)}
            </p>
          </div>

          <div className="mt-0.5 overflow-hidden text-sm text-muted-foreground">
            <p className="-ml-4 flex flex-wrap items-center">
              <MetaPart>
                {expense.receiptUrl && (
                  <>
                    <Paperclip className="mr-1 h-4 w-4 flex-shrink-0" aria-hidden />
                    <span className="sr-only">Receipt attached. </span>
                  </>
                )}
                <span className="truncate">
                  {paidByYou ? "You" : expense.paidByName} paid
                </span>
              </MetaPart>
              {yourShare && (
                <MetaPart className="whitespace-nowrap">
                  your share&nbsp;
                  <span className="font-medium tabular-nums text-foreground">
                    {money(yourShare.amount)}
                  </span>
                </MetaPart>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
