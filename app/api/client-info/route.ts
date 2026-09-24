import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Receives a one-off snapshot of how a device renders the site (viewport,
 * screen, zoom, browser) from /check and writes it to the server log, so a
 * layout problem reported from a phone can be diagnosed without guessing.
 * Nothing is stored; the payload is capped and never echoed back.
 */
export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > 4000) {
    return NextResponse.json({ error: "Too large" }, { status: 413 });
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  console.log(`[client-info] ${JSON.stringify(data)}`);
  return NextResponse.json({ ok: true });
}
