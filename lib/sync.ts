"use client";

import { getPendingExpenses, markSynced, discardQueued } from "@/lib/offline-db";

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
      let res: Response;
      try {
        res = await fetch("/api/expenses", {
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
      } catch {
        // Network blip — stop and retry the whole queue on the next online event.
        break;
      }

      if (item.localId == null) continue;
      if (res.ok) {
        await markSynced(item.localId);
        synced++;
      } else if (res.status >= 400 && res.status < 500) {
        // Permanent client error (validation / no longer a member): this item
        // will never be accepted, so drop it rather than retry it forever.
        await discardQueued(item.localId);
      } else {
        // Server error (5xx) — stop and retry on the next sync.
        break;
      }
    }
  } finally {
    syncing = false;
  }
  return synced;
}
