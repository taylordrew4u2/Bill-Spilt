import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireHousehold, handle, ApiError } from "@/lib/api";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Accepted receipt types. Receipts arrive as camera photos, gallery images, or
 * files people already have (a PDF billing statement, a scan), so the list
 * covers both. The extension is derived from the type — never from the
 * uploaded filename — so a crafted name can't pick the stored object's suffix.
 */
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

// Upload a receipt (photo or file) to Vercel Blob and return its public URL.
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
    if (file.size === 0) throw new ApiError(400, "That file is empty");
    if (file.size > MAX_BYTES) throw new ApiError(413, "File too large (max 10 MB)");

    // Some browsers report an empty type for gallery/file picks; fall back to
    // the filename extension before rejecting an otherwise valid receipt.
    const type = file.type || typeFromName(file.name);
    const ext = ALLOWED[type];
    if (!ext) {
      throw new ApiError(415, "Receipts can be a photo (JPG, PNG, WEBP, HEIC) or a PDF");
    }

    const key = `receipts/${householdId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const blob = await put(key, file, { access: "public", contentType: type });

    return NextResponse.json({ url: blob.url, contentType: type });
  });
}

/** Best-effort MIME lookup for browsers that send a blank file type. */
function typeFromName(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const byExt: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    heic: "image/heic",
    heif: "image/heif",
    pdf: "application/pdf",
  };
  return byExt[ext] ?? "";
}
