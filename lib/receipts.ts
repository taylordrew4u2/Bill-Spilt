import { sql } from "@/lib/db";

/**
 * Receipt storage, backed by the app's Postgres database.
 *
 * Receipts used to live in Vercel Blob, which meant a second storage product
 * to provision, pay attention to, and hold a token for. They now go in the
 * database the app already needs, so the whole app runs on one free store.
 *
 * Bytes move over the wire as base64 and are kept as BYTEA: `decode()` on the
 * way in, `encode()` on the way out. That keeps the column compact while never
 * asking a driver to marshal raw binary — the Neon HTTP driver and `pg` over
 * TCP (both supported by lib/db.ts) disagree about that.
 */

/**
 * Accepted receipt types. Receipts arrive as camera photos, gallery images, or
 * files people already have (a PDF billing statement, a scan), so the list
 * covers both. The extension is derived from the type — never from the
 * uploaded filename — so a crafted name can't pick the stored object's suffix.
 */
export const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

/**
 * Per-file ceiling. Lower than the old object-store limit on purpose: these
 * bytes now sit in the database's free-tier quota, and the picker downscales
 * photos before sending, so real receipts land far below this.
 */
export const MAX_BYTES = 5 * 1024 * 1024;

/** Best-effort MIME lookup for browsers that send a blank file type. */
export function typeFromName(name: string): string {
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

/**
 * Store a receipt and return the path it is served from.
 *
 * The path carries the file extension (`/api/receipts/<id>.pdf`) because the
 * UI decides between a PDF link and an image preview from the URL suffix, and
 * receipts saved back when Blob served them look the same way.
 */
export async function storeReceipt(args: {
  householdId: string;
  uploadedBy: string;
  contentType: string;
  bytes: Buffer;
}): Promise<{ path: string }> {
  const ext = ALLOWED_TYPES[args.contentType];
  const { rows } = await sql`
    INSERT INTO receipts (household_id, uploaded_by, content_type, byte_size, data)
    VALUES (
      ${args.householdId}, ${args.uploadedBy}, ${args.contentType},
      ${args.bytes.byteLength}, decode(${args.bytes.toString("base64")}, 'base64')
    )
    RETURNING id
  `;
  return { path: `/api/receipts/${rows[0].id}.${ext}` };
}

export type StoredReceipt = {
  householdId: string;
  contentType: string;
  bytes: Buffer;
};

/** Read a receipt back. Returns null when the id doesn't exist. */
export async function readReceipt(id: string): Promise<StoredReceipt | null> {
  const { rows } = await sql`
    SELECT household_id, content_type, encode(data, 'base64') AS b64
    FROM receipts WHERE id = ${id} LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    householdId: row.household_id as string,
    contentType: row.content_type as string,
    bytes: Buffer.from(row.b64 as string, "base64"),
  };
}

/**
 * Drop receipts no expense points at any more — a receipt attached and then
 * removed before the expense was saved, or one replaced by a later upload.
 * Without this, abandoned uploads would sit in the database forever and eat a
 * free tier that the whole app shares. The grace period keeps a receipt that
 * was uploaded moments ago and is still being attached in an open form.
 */
export async function pruneOrphanReceipts(graceHours = 24): Promise<number> {
  const { rowCount } = await sql`
    DELETE FROM receipts r
    WHERE r.created_at < now() - make_interval(hours => ${graceHours})
      AND NOT EXISTS (
        SELECT 1 FROM expenses e
        WHERE e.receipt_url LIKE '%/api/receipts/' || r.id || '.%'
      )
  `;
  return rowCount;
}
