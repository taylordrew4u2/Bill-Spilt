import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

/**
 * Provider-agnostic database access.
 *
 * The app may be pointed at different managed Postgres providers depending on
 * what was provisioned in the Vercel marketplace (Neon, Prisma Postgres, etc.).
 * Rather than depend on a single provider's quirks, we pick a backend from the
 * connection string's host:
 *
 *   - Neon hosts (`*.neon.tech`) → Neon's low-latency HTTP driver.
 *   - Everything else            → standard `pg` over TCP (works with Prisma
 *                                  Postgres, Supabase, RDS, plain Postgres…).
 *
 * Both are exposed through a single `sql` helper that works as a tagged
 * template (`sql\`SELECT ${x}\``) and as a function (`sql(text, params)`), and
 * always resolves to a pg-style `{ rows, rowCount }` result.
 */
const connectionString =
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  "";

type QueryResult = { rows: any[]; rowCount: number };
type Runner = (text: string, params: unknown[]) => Promise<QueryResult>;

function makeRunner(conn: string): Runner | null {
  if (!conn) return null;
  let host = "";
  try {
    host = new URL(conn).hostname;
  } catch {
    /* fall through to pg, which has its own parser */
  }

  if (host.includes("neon.tech")) {
    const client = neon(conn, { fullResults: true });
    return async (text, params) => {
      const r = (await client(text, params as any[])) as any;
      return { rows: r.rows, rowCount: r.rowCount ?? r.rows.length };
    };
  }

  // Standard TCP pool. Small max keeps us within managed-provider connection
  // limits across warm serverless instances. SSL is required by managed hosts.
  const isLocal = host === "localhost" || host === "127.0.0.1";
  const pool = new Pool({
    connectionString: conn,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
  return async (text, params) => {
    const r = await pool.query(text, params as any[]);
    return { rows: r.rows, rowCount: r.rowCount ?? r.rows.length };
  };
}

const runner = makeRunner(connectionString);

/**
 * Unified query helper. Usage:
 *   await sql`SELECT * FROM users WHERE id = ${id}`   // tagged template
 *   await sql(textWithDollarParams, [a, b])           // function form
 */
export const sql = ((
  strings: TemplateStringsArray | string,
  ...values: unknown[]
): Promise<QueryResult> => {
  if (!runner) {
    throw new Error(
      "Database is not configured: set POSTGRES_URL to a Postgres connection string.",
    );
  }
  if (typeof strings === "string") {
    return runner(strings, (values[0] as unknown[]) ?? []);
  }
  // Build a parameterized query ($1, $2, …) from the template literal.
  let text = strings[0];
  for (let i = 0; i < values.length; i++) {
    text += `$${i + 1}${strings[i + 1]}`;
  }
  return runner(text, values);
}) as {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<QueryResult>;
  (text: string, params?: unknown[]): Promise<QueryResult>;
};

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
  // gen_random_uuid() is a core function since Postgres 13, so pgcrypto isn't
  // strictly required. Some managed providers forbid CREATE EXTENSION, so try
  // it but don't fail the whole bootstrap if it's not permitted.
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  } catch {
    /* relying on core gen_random_uuid() */
  }

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      payment_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  // For databases created before payment methods existed.
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_methods JSONB NOT NULL DEFAULT '[]'::jsonb`;

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

  await sql`
    CREATE TABLE IF NOT EXISTS activity_log (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
      actor_name   TEXT NOT NULL,
      action       TEXT NOT NULL,
      detail       TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ads (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title       TEXT NOT NULL,
      body        TEXT,
      image_url   TEXT,
      link_url    TEXT NOT NULL,
      cta         TEXT,
      placement   TEXT NOT NULL DEFAULT 'all',
      weight      INT NOT NULL DEFAULT 1,
      active      BOOLEAN NOT NULL DEFAULT true,
      impressions BIGINT NOT NULL DEFAULT 0,
      clicks      BIGINT NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS password_resets (
      token_hash TEXT PRIMARY KEY,
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_expenses_household ON expenses(household_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_splits_expense ON expense_splits(expense_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_members_user ON household_members(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_settlements_household ON settlements(household_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_activity_household ON activity_log(household_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(active, placement)`;
}

/** Max members per household (the "reasonable cap" of 12). */
export const MAX_MEMBERS = 12;
