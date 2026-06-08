"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Trash2, Paperclip } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { CATEGORIES, type Expense } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

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
}: {
  expense: Expense;
  currentUserId: string | null;
  onDelete: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const [removing, setRemoving] = React.useState(false);
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
        onDragEnd={handleDragEnd}
        className="relative flex touch-pan-y items-center gap-3 bg-card py-3"
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
          <p className="font-semibold">{formatCurrency(expense.amount)}</p>
          {yourShare && (
            <p className="text-xs text-muted-foreground">
              your share {formatCurrency(yourShare.amount)}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
