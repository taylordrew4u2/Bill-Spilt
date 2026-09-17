import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation";
import { handle } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const { name, email, password } = parsed.data;

    await ensureSchema();
    // Case-insensitive: otherwise "Sam@x.com" and "sam@x.com" become two
    // accounts, and only one of them can ever log in.
    const existing = await sql`
      SELECT 1 FROM users WHERE lower(email) = ${email} LIMIT 1
    `;
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }

    const hash = await hashPassword(password);
    const { rows } = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name}, ${hash})
      RETURNING id, email, name
    `;
    return NextResponse.json({ user: rows[0] }, { status: 201 });
  });
}
