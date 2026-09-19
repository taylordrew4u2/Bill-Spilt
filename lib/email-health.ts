import { sql, ensureSchema } from "@/lib/db";

/**
 * Durable record of how the password-reset provider last behaved.
 *
 * This state used to live in a module-level variable in `lib/email.ts`, which
 * does not survive serverless: every lambda instance has its own memory, so the
 * instance answering `/api/health` was almost never the one that tried to send.
 * A revoked Gmail app password therefore read as "everything is fine" — while
 * `/forgot` told people to check an inbox no mail could reach. That is exactly
 * the lockout this is supposed to catch, so the record lives in Postgres where
 * one instance's failure becomes everybody's.
 */
export type EmailHealth = {
  /** Did the most recent provider check succeed? */
  ok: boolean;
  /** When that check ran (ISO 8601). */
  at: string;
  /** Provider error text when `ok` is false. */
  message: string | null;
};

/** Row key in `app_health`. */
const KEY = "email";

/** What `/forgot` reports back to the browser. */
export type ForgotDelivery = "sent" | "unconfigured" | "provider-error";

/**
 * Which outcome `/forgot` should report.
 *
 * A missing provider or a rejecting one fails *identically for every address*,
 * so this is computed from provider state alone — never from whether the
 * address is registered — and is safe to evaluate *before* the account lookup.
 * The no-enumeration rule that governs `unconfigured` governs this too.
 */
export function forgotDelivery(
  configured: boolean,
  health: EmailHealth | null,
): ForgotDelivery {
  if (!configured) return "unconfigured";
  if (health && !health.ok) return "provider-error";
  return "sent";
}

/**
 * Whether the provider needs re-checking before we trust `health`.
 *
 * Only a recorded failure (or no record yet) is worth re-probing: once a check
 * has passed there is nothing to disprove, and probing on every request would
 * add an SMTP handshake to a screen people reach in a hurry. Probing a recorded
 * failure is what makes recovery automatic — fix `SMTP_PASS` and the next
 * request notices instead of the deployment staying stuck reporting an error.
 */
export function shouldProbeProvider(health: EmailHealth | null): boolean {
  return health === null || !health.ok;
}

/**
 * Accept whatever the driver hands back for a `TEXT` column and validate it.
 * Anything unrecognisable reads as "no record", which callers treat as
 * "unproven" rather than "broken".
 */
export function normalizeEmailHealth(value: unknown): EmailHealth | null {
  let parsed: unknown = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;

  const { ok, at, message } = parsed as Record<string, unknown>;
  if (typeof ok !== "boolean" || typeof at !== "string") return null;
  return { ok, at, message: typeof message === "string" ? message : null };
}

/** The last recorded provider check, or `null` when there is none to read. */
export async function readEmailHealth(): Promise<EmailHealth | null> {
  try {
    const { rows } = await sql`SELECT value FROM app_health WHERE key = ${KEY}`;
    return rows.length > 0 ? normalizeEmailHealth(rows[0].value) : null;
  } catch (e) {
    // Diagnostics must never be the reason a page fails; the caller falls back
    // to treating the provider as unproven.
    console.error("[email-health] could not read the provider record:", e);
    return null;
  }
}

/** Record the outcome of a provider check (a reset send, or a credential probe). */
export async function recordEmailHealth(
  ok: boolean,
  message: string | null = null,
): Promise<void> {
  const value: EmailHealth = { ok, at: new Date().toISOString(), message };
  try {
    await ensureSchema();
    await sql`
      INSERT INTO app_health (key, value, updated_at)
      VALUES (${KEY}, ${JSON.stringify(value)}, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;
  } catch (e) {
    // Same reasoning as above: never let bookkeeping break the send path.
    console.error("[email-health] could not record the provider state:", e);
  }
}
