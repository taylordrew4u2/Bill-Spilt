#!/usr/bin/env node
/**
 * Set a user's password directly against the database.
 *
 * The escape hatch for when the emailed reset flow can't help: no email
 * provider configured, mail not arriving, or you're simply locked out of the
 * account that runs the site.
 *
 * Usage:
 *   POSTGRES_URL=postgres://... node scripts/set-password.mjs you@example.com 'new-password'
 *
 * With no password argument it generates a strong one and prints it.
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const [email, passwordArg] = process.argv.slice(2);

if (!email) {
  console.error(
    "Usage: POSTGRES_URL=... node scripts/set-password.mjs <email> [new-password]",
  );
  process.exit(1);
}

const conn =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!conn) {
  console.error(
    "No database connection string. Set POSTGRES_URL (copy it from your hosting\n" +
      "provider's dashboard, e.g. Vercel → Project → Storage, or `vercel env pull`).",
  );
  process.exit(1);
}

const password = passwordArg ?? randomBytes(9).toString("base64url");
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

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

try {
  const hash = await bcrypt.hash(password, 10);
  // Case-insensitive match, so an account stored as "You@Example.com" is found.
  const { rows } = await pool.query(
    `UPDATE users SET password_hash = $1
     WHERE lower(email) = lower($2)
     RETURNING id, email`,
    [hash, email.trim()],
  );

  if (rows.length === 0) {
    const { rows: all } = await pool.query(
      `SELECT email FROM users ORDER BY created_at LIMIT 20`,
    );
    console.error(`No account found for ${email}.`);
    if (all.length > 0) {
      console.error("\nAccounts in this database:");
      for (const r of all) console.error(`  ${r.email}`);
    } else {
      console.error(
        "\nThis database has no users at all — sign up first, or check that\n" +
          "POSTGRES_URL points at the same database the deployed app uses.",
      );
    }
    process.exit(1);
  }

  // Any outstanding reset links for this user are now stale.
  await pool
    .query(`DELETE FROM password_resets WHERE user_id = $1`, [rows[0].id])
    .catch(() => {});

  console.log(`Password updated for ${rows[0].email}`);
  if (!passwordArg) console.log(`New password: ${password}`);
  console.log("Log in at /login, then change it under Settings.");
} catch (e) {
  console.error("Failed to update the password:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
