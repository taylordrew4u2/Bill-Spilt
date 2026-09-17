import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { sql, ensureSchema } from "@/lib/db";
import { handle } from "@/lib/api";
import { forgotSchema } from "@/lib/validation";
import { emailConfigured, sendPasswordResetEmail } from "@/lib/email";

export const runtime = "nodejs";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * Request a password-reset email.
 *
 * Responds 200 whether or not the account exists (no email enumeration), but
 * `delivery` tells the client what actually happened so we stop showing "check
 * your email" on a deployment that can't send any:
 *
 *   "sent"         — a reset link was mailed if that account exists.
 *   "unconfigured" — no email provider is set up, so nobody can be mailed.
 *
 * `unconfigured` is decided before the account is looked up, so it reveals
 * nothing about whether the address is registered.
 */
export async function POST(req: Request) {
  return handle(async () => {
    if (!emailConfigured()) {
      console.error(
        "[forgot] password reset requested but no email provider is configured " +
          "(set RESEND_API_KEY, or SMTP_USER + SMTP_PASS)",
      );
      return NextResponse.json({ ok: true, delivery: "unconfigured" });
    }

    const parsed = forgotSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: true, delivery: "sent" }); // don't leak validation either
    }
    const { email } = parsed.data;

    await ensureSchema();
    // Case-insensitive so accounts stored with mixed-case emails can still
    // recover their password.
    const { rows } = await sql`
      SELECT id, email FROM users WHERE lower(email) = ${email} LIMIT 1
    `;

    if (rows.length > 0) {
      const userId = rows[0].id as string;
      const token = randomBytes(32).toString("hex");
      const tokenHash = sha256(token);
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

      // One active token per user.
      await sql`DELETE FROM password_resets WHERE user_id = ${userId}`;
      await sql`
        INSERT INTO password_resets (token_hash, user_id, expires_at)
        VALUES (${tokenHash}, ${userId}, ${expires})
      `;

      const origin =
        process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
      const link = `${origin}/reset?token=${token}`;
      try {
        // Mail the address as stored, so a mixed-case account still gets it.
        await sendPasswordResetEmail(rows[0].email as string, link);
      } catch (e) {
        // Swallowed on purpose: reporting the failure here would reveal that
        // the address is registered. The operator sees it in the logs and in
        // /api/health (see lib/email.ts).
        console.error("[forgot] failed to send reset email:", e);
      }
    }

    return NextResponse.json({ ok: true, delivery: "sent" });
  });
}
