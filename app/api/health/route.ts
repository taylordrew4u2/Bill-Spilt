import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight diagnostics endpoint. Reports whether the database is reachable
 * and whether the schema bootstrap succeeds. Returns only sanitized status —
 * never connection strings or secrets — so it's safe to leave deployed.
 */
export async function GET() {
  const result: {
    env: Record<string, boolean>;
    connect: "ok" | "fail";
    schema: "ok" | "fail" | "skipped";
    error?: string;
  } = {
    env: {
      POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
      POSTGRES_PRISMA_URL: Boolean(process.env.POSTGRES_PRISMA_URL),
      POSTGRES_URL_NON_POOLING: Boolean(process.env.POSTGRES_URL_NON_POOLING),
      AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
      BLOB_READ_WRITE_TOKEN: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    },
    connect: "fail",
    schema: "skipped",
  };

  try {
    await sql`SELECT 1 AS ok`;
    result.connect = "ok";
  } catch (e) {
    result.error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    return NextResponse.json(result, { status: 500 });
  }

  try {
    await ensureSchema();
    result.schema = "ok";
  } catch (e) {
    result.schema = "fail";
    result.error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
