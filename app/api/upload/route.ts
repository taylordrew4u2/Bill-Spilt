import { NextResponse } from "next/server";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import {
  ALLOWED_TYPES,
  MAX_BYTES,
  storeReceipt,
  typeFromName,
} from "@/lib/receipts";

export const runtime = "nodejs";

// Store a receipt (photo or file) in Postgres and return the path it's served
// from. Kept as an app-relative path so receipts survive a domain change.
export async function POST(req: Request) {
  return handle(async () => {
    const { userId, householdId } = await requireHousehold();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "No file provided");
    if (file.size === 0) throw new ApiError(400, "That file is empty");
    if (file.size > MAX_BYTES) throw new ApiError(413, "File too large (max 5 MB)");

    // Some browsers report an empty type for gallery/file picks; fall back to
    // the filename extension before rejecting an otherwise valid receipt.
    const type = file.type || typeFromName(file.name);
    if (!ALLOWED_TYPES[type]) {
      throw new ApiError(415, "Receipts can be a photo (JPG, PNG, WEBP, HEIC) or a PDF");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    // `file.size` is what the browser claims; this is what actually arrived.
    if (bytes.byteLength > MAX_BYTES) {
      throw new ApiError(413, "File too large (max 5 MB)");
    }

    const { path } = await storeReceipt({
      householdId,
      uploadedBy: userId,
      contentType: type,
      bytes,
    });

    return NextResponse.json({ url: path, contentType: type });
  });
}
