import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { sql, ensureSchema } from "@/lib/db";
import { handle, ApiError } from "@/lib/api";
import { resetSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// Complete a password reset using a valid, unexpired token.
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = resetSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0]?.message ?? "Invalid request");
    }
    const { token, password } = parsed.data;

    await ensureSchema();
    const tokenHash = sha256(token);
    const { rows } = await sql`
      SELECT user_id FROM password_resets
      WHERE token_hash = ${tokenHash} AND expires_at > now()
      LIMIT 1
    `;
    if (rows.length === 0) {
      throw new ApiError(400, "This reset link is invalid or has expired");
    }
    const userId = rows[0].user_id as string;

    const hash = await hashPassword(password);
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`;
    // Invalidate all reset tokens for this user.
    await sql`DELETE FROM password_resets WHERE user_id = ${userId}`;

    return NextResponse.json({ ok: true });
  });
}
