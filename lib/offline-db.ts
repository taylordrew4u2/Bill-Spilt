"use client";

import Dexie, { type Table } from "dexie";
import type { QueuedExpense } from "@/lib/types";

/**
 * IndexedDB store (via Dexie) for offline-created expenses. When the user adds
 * an expense while offline it is written here with `synced = 0`, then flushed
 * to the server by `lib/sync.ts` once connectivity returns.
 */
class BillSpiltDB extends Dexie {
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

let _db: BillSpiltDB | null = null;

/** Lazily construct the DB only in the browser. */
export function getDB(): BillSpiltDB | null {
  if (typeof window === "undefined") return null;
  if (!_db) _db = new BillSpiltDB();
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

/**
 * Drop a queued expense the server has permanently rejected (a 4xx that will
 * never succeed), so it doesn't block/loop the queue forever.
 */
export async function discardQueued(localId: number): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.queuedExpenses.delete(localId);
}

export async function pendingCount(): Promise<number> {
  const db = getDB();
  if (!db) return 0;
  return db.queuedExpenses.where("synced").equals(0).count();
}
