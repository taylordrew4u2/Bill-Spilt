import { sql } from "@/lib/db";
import { requireUserId, handle, ApiError } from "@/lib/api";
import { readReceipt } from "@/lib/receipts";

export const runtime = "nodejs";

/** `<uuid>.<ext>` — the extension is cosmetic, the id is what we look up. */
const KEY = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.[a-z0-9]+$/i;

/**
 * Serve a stored receipt.
 *
 * Blob served receipts from a public, unguessable URL. Coming from our own
 * database we can do better: only a member of the household the receipt
 * belongs to can read it. Same-origin means the session cookie rides along on
 * a plain `<img src>` or link, so nothing on the client has to change.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  return handle(async () => {
    const userId = await requireUserId();
    const { key } = await params;
    const id = KEY.exec(key)?.[1];
    if (!id) throw new ApiError(404, "Receipt not found");

    const receipt = await readReceipt(id);
    if (!receipt) throw new ApiError(404, "Receipt not found");

    const { rows } = await sql`
      SELECT 1 FROM household_members
      WHERE household_id = ${receipt.householdId} AND user_id = ${userId} LIMIT 1
    `;
    // Same answer as a missing receipt: whether one exists isn't a stranger's
    // business either.
    if (rows.length === 0) throw new ApiError(404, "Receipt not found");

    return new Response(new Uint8Array(receipt.bytes), {
      headers: {
        "Content-Type": receipt.contentType,
        "Content-Length": String(receipt.bytes.byteLength),
        // Receipts never change once stored, and the response is per-user
        // authorized, so cache it privately for a good long while.
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
