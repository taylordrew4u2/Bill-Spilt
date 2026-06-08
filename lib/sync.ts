"use client";

import { getPendingExpenses, markSynced } from "@/lib/offline-db";

let syncing = false;

/**
 * Flush all queued offline expenses to the server. Returns the number of
 * expenses successfully synced. Safe to call repeatedly; it self-guards
 * against concurrent runs.
 */
export async function syncPending(): Promise<number> {
  if (syncing || typeof navigator === "undefined" || !navigator.onLine) {
    return 0;
  }
  syncing = true;
  let synced = 0;
  try {
    const pending = await getPendingExpenses();
    for (const item of pending) {
      try {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: item.description,
            amount: item.amount,
            category: item.category,
            splitType: item.splitType,
            paidBy: item.paidBy,
            splits: item.splits,
            createdAt: item.createdAt,
          }),
        });
        if (res.ok && item.localId != null) {
          await markSynced(item.localId);
          synced++;
        }
      } catch {
        // Network blip — stop and retry on the next online event.
        break;
      }
    }
  } finally {
    syncing = false;
  }
  return synced;
}
