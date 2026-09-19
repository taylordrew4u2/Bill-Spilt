import { NextResponse } from "next/server";
import { sql, dbConfigured } from "@/lib/db";
import { emailConfigured, emailProvider } from "@/lib/email";
import { readEmailHealth } from "@/lib/email-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Configuration check for whoever runs the deployment.
 *
 * Login and password reset both fail *silently* when an environment variable is
 * missing — a broken database looks exactly like a wrong password, and a
 * missing email provider looks exactly like a reset mail that never arrived.
 * This endpoint answers "is it me or is it the server?" without needing to log
 * in (which is the very thing that may be broken).
 *
 * It returns booleans and status words only — never a connection string, key,
 * or address. Send `Authorization: Bearer $CRON_SECRET` to additionally get the
 * last email/database error message for debugging.
 *
 * `passwordReset` reflects the last provider failure *recorded in the database*
 * rather than this instance's memory (see lib/email-health.ts): a revoked app
 * password leaves every environment variable in place, so configuration alone
 * cannot tell you whether mail is actually being delivered.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const detailed =
    Boolean(secret) &&
    req.headers.get("authorization") === `Bearer ${secret}`;

  let database: "ok" | "unreachable" | "unconfigured" = "unconfigured";
  let dbError: string | null = null;
  if (dbConfigured()) {
    try {
      await sql`SELECT 1`;
      database = "ok";
    } catch (e) {
      database = "unreachable";
      dbError = e instanceof Error ? e.message : String(e);
    }
  }

  const authSecret = Boolean(process.env.AUTH_SECRET);
  // Read from Postgres rather than this instance's memory: the lambda that
  // serves this request is almost never the one that tried to send, which is
  // how a revoked app password went unnoticed (see lib/email-health.ts).
  const emailHealth = await readEmailHealth();
  const emailFailure = emailHealth && !emailHealth.ok ? emailHealth : null;

  // Login needs a database and AUTH_SECRET; password reset needs email on top.
  const canLogIn = database === "ok" && authSecret;
  const canResetPassword = canLogIn && emailConfigured() && !emailFailure;

  return NextResponse.json(
    {
      // A configured-but-rejected provider (expired API key, revoked app
      // password) is the failure mode that looks like nothing at all, so a
      // recorded provider failure counts against `ok` until one succeeds.
      ok: canLogIn && canResetPassword,
      login: {
        ready: canLogIn,
        database,
        authSecret,
      },
      passwordReset: {
        ready: canResetPassword,
        email: emailConfigured() ? emailProvider() : "unconfigured",
        // Last failure anyone recorded, or null if the provider is untested
        // or last passed. A non-null value here means resets are NOT being
        // delivered, whatever `ready` says about configuration.
        lastSendFailedAt: emailFailure?.at ?? null,
      },
      ...(detailed
        ? {
            detail: {
              databaseError: dbError,
              emailError: emailFailure?.message ?? null,
            },
          }
        : {}),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
