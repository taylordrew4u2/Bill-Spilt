#!/usr/bin/env node
/**
 * Move receipts that still live in Vercel Blob into Postgres.
 *
 * Receipts used to be uploaded to Blob and referenced by their public URL.
 * They're stored in the database now, so any expense still pointing at an
 * external URL would break the moment the Blob store is deleted. This
 * downloads each one, stores the bytes, and repoints the expense at
 * `/api/receipts/<id>.<ext>`.
 *
 * Safe to re-run: rows already on a relative path are skipped. Run it while
 * the Blob store still exists, then delete the store.
 *
 * Usage:
 *   POSTGRES_URL=postgres://... node scripts/migrate-blob-receipts.mjs [--dry-run]
 */
import { Pool } from "pg";

const dryRun = process.argv.includes("--dry-run");

const conn =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!conn) {
  console.error(
    "No database connection string. Set POSTGRES_URL (Vercel → Project → Storage,\n" +
      "or `vercel env pull`).",
  );
  process.exit(1);
}

const EXT_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};
const TYPE_BY_EXT = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

const MAX_BYTES = 25 * 1024 * 1024; // generous: these were uploaded under the old 10 MB cap

const host = (() => {
  try {
    return new URL(conn).hostname;
  } catch {
    return "";
  }
})();
const isLocal = host === "localhost" || host === "127.0.0.1";

const pool = new Pool({
  connectionString: conn,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
});

let moved = 0;
let skipped = 0;
let failed = 0;

try {
  const { rows } = await pool.query(
    `SELECT id, household_id, receipt_url
     FROM expenses
     WHERE receipt_url IS NOT NULL AND receipt_url LIKE 'http%'
     ORDER BY created_at`,
  );

  if (rows.length === 0) {
    console.log("Nothing to migrate — no expense points at an external receipt.");
    process.exit(0);
  }
  console.log(`${rows.length} receipt(s) to migrate${dryRun ? " (dry run)" : ""}.`);

  for (const row of rows) {
    try {
      const res = await fetch(row.receipt_url);
      if (!res.ok) {
        console.error(`  ✗ ${row.receipt_url} → HTTP ${res.status}`);
        failed++;
        continue;
      }

      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) {
        console.error(`  ✗ ${row.receipt_url} → unusable size (${buf.byteLength} bytes)`);
        failed++;
        continue;
      }

      // Trust the stored URL's extension over a CDN's content-type header.
      const ext = row.receipt_url.split("?")[0].toLowerCase().split(".").pop();
      const type =
        TYPE_BY_EXT[ext] ||
        (res.headers.get("content-type") || "").split(";")[0].trim();
      const outExt = EXT_BY_TYPE[type];
      if (!outExt) {
        console.error(`  ✗ ${row.receipt_url} → unrecognised type "${type}"`);
        failed++;
        continue;
      }

      if (dryRun) {
        console.log(`  · would move ${row.receipt_url} (${buf.byteLength} bytes, ${type})`);
        moved++;
        continue;
      }

      const { rows: inserted } = await pool.query(
        `INSERT INTO receipts (household_id, content_type, byte_size, data)
         VALUES ($1, $2, $3, decode($4, 'base64'))
         RETURNING id`,
        [row.household_id, type, buf.byteLength, buf.toString("base64")],
      );
      const path = `/api/receipts/${inserted[0].id}.${outExt}`;
      await pool.query(`UPDATE expenses SET receipt_url = $1 WHERE id = $2`, [
        path,
        row.id,
      ]);
      console.log(`  ✓ ${row.receipt_url} → ${path}`);
      moved++;
    } catch (e) {
      console.error(`  ✗ ${row.receipt_url} → ${e.message}`);
      failed++;
    }
  }

  console.log(
    `\nDone. ${moved} moved, ${skipped} skipped, ${failed} failed.` +
      (failed ? "\nRe-run to retry the failures; migrated rows are skipped." : ""),
  );
  if (failed) process.exitCode = 1;
} catch (e) {
  console.error("Migration failed:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
