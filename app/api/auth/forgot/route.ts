import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { sql, ensureSchema } from "@/lib/db";
import { handle } from "@/lib/api";
import { forgotSchema } from "@/lib/validation";
import { emailConfigured, sendPasswordResetEmail } from "@/lib/email";

export const runtime = "nodejs";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// Request a password-reset email. Always responds 200 (never reveals whether an
// account exists) to avoid email enumeration.
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = forgotSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: true }); // don't leak validation either
    }
    const { email } = parsed.data;

    await ensureSchema();
    const { rows } = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `;

    if (rows.length > 0 && emailConfigured()) {
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
        await sendPasswordResetEmail(email, link);
      } catch (e) {
        console.error("[forgot] failed to send reset email:", e);
      }
    }

    return NextResponse.json({ ok: true });
  });
}
