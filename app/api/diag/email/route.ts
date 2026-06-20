import { NextResponse } from "next/server";
import { verifyEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY diagnostic: reports SMTP config presence and verifies the SMTP
// connection/auth (does NOT send mail). Token-gated; removed after debugging.
const TOKEN = "d3bf91a64e2c47f08b5e6a17c9d240ab";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await verifyEmail();
  return NextResponse.json(result);
}
