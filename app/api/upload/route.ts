import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireHousehold, handle, ApiError } from "@/lib/api";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic"];

// Upload a receipt photo to Vercel Blob and return its public URL.
export async function POST(req: Request) {
  return handle(async () => {
    const { householdId } = await requireHousehold();

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new ApiError(
        503,
        "Receipt storage is not configured (set BLOB_READ_WRITE_TOKEN)",
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "No file provided");
    if (file.size > MAX_BYTES) throw new ApiError(413, "File too large (max 5 MB)");
    if (file.type && !ALLOWED.includes(file.type)) {
      throw new ApiError(415, "Unsupported image type");
    }

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const key = `receipts/${householdId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const blob = await put(key, file, {
      access: "public",
      contentType: file.type || "image/jpeg",
    });

    return NextResponse.json({ url: blob.url });
  });
}
