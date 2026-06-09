import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireUserId, handle, ApiError } from "@/lib/api";
import { getProfile } from "@/lib/queries";
import { profileSchema } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const profile = await getProfile(userId);
    if (!profile) throw new ApiError(404, "Profile not found");
    return NextResponse.json({ profile });
  });
}

// Update the current user's name, email, payment methods, and (optionally)
// password. Available to every user for their own profile.
export async function PATCH(req: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const parsed = profileSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0]?.message ?? "Invalid profile");
    }
    const { name, email, paymentMethods, currentPassword, newPassword } =
      parsed.data;

    // Email must stay unique across users.
    const clash = await sql`
      SELECT 1 FROM users WHERE email = ${email} AND id <> ${userId} LIMIT 1
    `;
    if (clash.rows.length > 0) {
      throw new ApiError(409, "That email is already in use");
    }

    // Optional password change requires the current password.
    if (newPassword) {
      const { rows } = await sql`
        SELECT password_hash FROM users WHERE id = ${userId} LIMIT 1
      `;
      const ok =
        rows[0] && (await verifyPassword(currentPassword ?? "", rows[0].password_hash));
      if (!ok) throw new ApiError(403, "Current password is incorrect");
      const hash = await hashPassword(newPassword);
      await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`;
    }

    await sql`
      UPDATE users SET
        name = ${name},
        email = ${email},
        payment_methods = ${JSON.stringify(paymentMethods)}::jsonb
      WHERE id = ${userId}
    `;

    return NextResponse.json({ ok: true });
  });
}
