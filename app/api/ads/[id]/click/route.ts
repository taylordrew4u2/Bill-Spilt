import { NextResponse } from "next/server";
import { recordClick } from "@/lib/ads";

export const runtime = "nodejs";

// Track a click, then redirect to the ad's destination. Public so the redirect
// works even from a new tab/window.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const url = await recordClick(params.id);
    if (url) return NextResponse.redirect(url);
  } catch {
    /* fall through */
  }
  // Fall back to home if the ad is gone.
  return NextResponse.redirect(new URL("/home", _req.url));
}
