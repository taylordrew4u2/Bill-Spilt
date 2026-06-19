"use client";

import Dexie, { type Table } from "dexie";
import type { QueuedExpense } from "@/lib/types";

/**
 * IndexedDB store (via Dexie) for offline-created expenses. When the user adds
 * an expense while offline it is written here with `synced = 0`, then flushed
 * to the server by `lib/sync.ts` once connectivity returns.
 */
class BillSplitDB extends Dexie {
  queuedExpenses!: Table<QueuedExpense, number>;

  constructor() {
    // Keep the IndexedDB name stable across the rebrand so any expenses queued
    // offline before the rename aren't orphaned.
    super("billbuddies");
    this.version(1).stores({
      // ++localId = auto-increment PK; index `synced` for fast pending lookups.
      queuedExpenses: "++localId, synced, householdId, createdAt",
    });
  }
}

let _db: BillSplitDB | null = null;

/** Lazily construct the DB only in the browser. */
export function getDB(): BillSplitDB | null {
  if (typeof window === "undefined") return null;
  if (!_db) _db = new BillSplitDB();
  return _db;
}

export async function queueExpense(
  expense: Omit<QueuedExpense, "localId" | "synced">,
): Promise<number | null> {
  const db = getDB();
  if (!db) return null;
  return db.queuedExpenses.add({ ...expense, synced: 0 });
}

export async function getPendingExpenses(): Promise<QueuedExpense[]> {
  const db = getDB();
  if (!db) return [];
  return db.queuedExpenses.where("synced").equals(0).toArray();
}

export async function markSynced(localId: number): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.queuedExpenses.delete(localId);
}

export async function pendingCount(): Promise<number> {
  const db = getDB();
  if (!db) return 0;
  return db.queuedExpenses.where("synced").equals(0).count();
}
