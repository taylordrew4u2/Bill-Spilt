import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Database access via Neon's HTTP driver.
 *
 * We deliberately use `@neondatabase/serverless` directly rather than
 * `@vercel/postgres`'s `sql`/`createPool`, because the latter hard-rejects a
 * connection string unless its host contains `-pooler.` (pooled) — which makes
 * the app brittle to exactly how `POSTGRES_URL` was provisioned. The Neon HTTP
 * driver accepts BOTH pooled and direct connection strings, so the app works
 * regardless. `fullResults` makes queries return pg-style `{ rows, rowCount }`.
 */
const connectionString =
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  "";

const client = connectionString
  ? neon(connectionString, { fullResults: true })
  : null;

// A tagged-template (and `(query, params)`) function with the same surface the
// rest of the app expects. Throws a clear error if the DB is unconfigured,
// instead of crashing at import time (so /api/health can still report status).
export const sql = ((...args: unknown[]) => {
  if (!client) {
    throw new Error(
      "Database is not configured: set the POSTGRES_URL environment variable to a Neon connection string.",
    );
  }
  // Forwards both call forms: sql`...` and sql(queryText, params).
  // @ts-expect-error - variadic forwarding of overloaded call signatures
  return client(...args);
}) as unknown as NeonQueryFunction<false, true>;

/**
 * Idempotent schema bootstrap. Safe to call on every cold start; all
 * statements use IF NOT EXISTS so they only run once per database.
 *
 * We rely on pgcrypto's gen_random_uuid() (available on Vercel Postgres /
 * Neon) for primary keys.
 */
let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = bootstrap().catch((err) => {
      // Reset so a later request can retry after a transient failure.
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

async function bootstrap(): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS households (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS household_members (
      household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role         TEXT NOT NULL DEFAULT 'member',
      joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (household_id, user_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      description  TEXT NOT NULL,
      amount       NUMERIC(12,2) NOT NULL,
      category     TEXT NOT NULL DEFAULT 'other',
      split_type   TEXT NOT NULL DEFAULT 'equal',
      paid_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receipt_url  TEXT,
      recurring_id UUID,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS expense_splits (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount     NUMERIC(12,2) NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS recurring_bills (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      description  TEXT NOT NULL,
      amount       NUMERIC(12,2) NOT NULL,
      category     TEXT NOT NULL DEFAULT 'other',
      split_type   TEXT NOT NULL DEFAULT 'equal',
      paid_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      splits       JSONB NOT NULL DEFAULT '[]'::jsonb,
      frequency    TEXT NOT NULL DEFAULT 'monthly',
      next_run     DATE NOT NULL,
      active       BOOLEAN NOT NULL DEFAULT true,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settlements (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      from_user    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_user      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount       NUMERIC(12,2) NOT NULL,
      settled_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_expenses_household ON expenses(household_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_splits_expense ON expense_splits(expense_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_members_user ON household_members(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_settlements_household ON settlements(household_id)`;
}

/** Max members per household (the "reasonable cap" of 12). */
export const MAX_MEMBERS = 12;
