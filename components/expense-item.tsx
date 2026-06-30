"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Trash2, Paperclip } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { useMoney } from "@/components/app-data";
import { CATEGORIES, type Expense } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const DELETE_THRESHOLD = -96;

/**
 * A single expense row with swipe-to-delete (drag left to reveal/confirm
 * delete). Powered by framer-motion drag. Tapping the row opens the receipt
 * if one is attached.
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
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 flex items-center justify-end bg-destructive pr-6 text-destructive-foreground"
      >
        <Trash2 className="h-5 w-5" />
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
        className="relative flex cursor-pointer touch-pan-y items-center gap-3 bg-card py-3"
      >
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
          {cat?.emoji ?? "📦"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium">{expense.description}</p>
            {expense.receiptUrl && (
              <Paperclip className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {paidByYou ? "You" : expense.paidByName} paid ·{" "}
            {formatDate(expense.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{money(expense.amount)}</p>
          {yourShare && (
            <p className="text-xs text-muted-foreground">
              your share {money(yourShare.amount)}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
