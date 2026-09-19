import { describe, it, expect, vi, beforeEach } from "vitest";
import type { EmailHealth } from "@/lib/email-health";

const sql = vi.fn();
const emailConfigured = vi.fn();
const emailProviderHealthy = vi.fn();
const sendPasswordResetEmail = vi.fn();
const readEmailHealth = vi.fn();
const recordEmailHealth = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sql(...args),
  ensureSchema: vi.fn(async () => {}),
}));
// The real module pulls in NextAuth (and with it next/server) just for the
// error wrapper; re-implement that wrapper instead.
vi.mock("@/lib/api", async () => {
  const { NextResponse } = await import("next/server.js");
  class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  }
  return {
    ApiError,
    handle: <T,>(fn: () => Promise<T>) =>
      fn().catch((err: unknown) =>
        err instanceof ApiError
          ? NextResponse.json({ error: err.message }, { status: err.status })
          : NextResponse.json({ error: "Something went wrong" }, { status: 500 }),
      ),
  };
});
vi.mock("@/lib/email", () => ({
  emailConfigured: () => emailConfigured(),
  emailProviderHealthy: () => emailProviderHealthy(),
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmail(...args),
}));
// Keep the real decision rules (unit-tested in lib/email-health.test.ts) and
// stub only the database read/write they sit on.
vi.mock("@/lib/email-health", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/email-health")>(
      "@/lib/email-health",
    );
  return {
    ...actual,
    readEmailHealth: () => readEmailHealth(),
    recordEmailHealth: (...args: unknown[]) => recordEmailHealth(...args),
  };
});

const { POST } = await import("./route");

const request = (email: string) =>
  new Request("https://example.com/api/auth/forgot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

describe("POST /api/auth/forgot", () => {
  // A provider that last worked, and the state a revoked Gmail app password
  // leaves behind: every environment variable still in place.
  const passed: EmailHealth = {
    ok: true,
    at: "2026-09-19T21:16:00.000Z",
    message: null,
  };
  const failed: EmailHealth = {
    ok: false,
    at: "2026-09-19T20:42:02.000Z",
    message: "Invalid login: 535-5.7.8 Username and Password not accepted.",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    emailConfigured.mockReturnValue(true);
    emailProviderHealthy.mockResolvedValue({ ok: true });
    // No provider failure recorded yet.
    readEmailHealth.mockResolvedValue(null);
    // SELECT → one user; DELETE/INSERT → nothing to return.
    sql.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  it("reports 'unconfigured' when no email provider is set up", async () => {
    emailConfigured.mockReturnValue(false);

    const res = await POST(request("sam@example.com"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      delivery: "unconfigured",
    });
    // Decided before any lookup, so it can't leak whether the account exists.
    expect(sql).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("stops promising a link when the provider rejects our credentials", async () => {
    // Regression: a revoked app password left `emailConfigured()` true, so this
    // screen said "check your email" for a mailbox no mail could reach — the
    // dead end that made a locked-out operator impossible to recover.
    readEmailHealth.mockResolvedValue(failed);
    emailProviderHealthy.mockResolvedValue({ ok: false, error: failed.message! });

    const res = await POST(request("sam@example.com"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      delivery: "provider-error",
    });
    // Provider-level, so it's decided before the lookup: no account is touched
    // and nothing about who is registered can leak.
    expect(sql).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    // Refreshed, so /api/health reports the same failure.
    expect(recordEmailHealth).toHaveBeenCalledWith(false, failed.message);
  });

  it("recovers on its own once the credentials work again", async () => {
    // The re-probe is what stops a fixed app password from needing a redeploy.
    readEmailHealth.mockResolvedValue(failed);
    emailProviderHealthy.mockResolvedValue({ ok: true });
    sql.mockResolvedValueOnce({
      rows: [{ id: "u1", email: "sam@example.com" }],
      rowCount: 1,
    });

    const res = await POST(request("sam@example.com"));

    await expect(res.json()).resolves.toEqual({ ok: true, delivery: "sent" });
    expect(recordEmailHealth).toHaveBeenCalledWith(true, null);
    expect(sendPasswordResetEmail).toHaveBeenCalled();
  });

  it("skips the probe while the provider is known to be working", async () => {
    readEmailHealth.mockResolvedValue(passed);
    sql.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await POST(request("sam@example.com"));

    // No SMTP handshake added to a screen people reach in a hurry.
    expect(emailProviderHealthy).not.toHaveBeenCalled();
  });

  it("sends a reset link to the address as stored, matched case-insensitively", async () => {
    sql.mockResolvedValueOnce({
      rows: [{ id: "u1", email: "Sam@Example.com" }],
      rowCount: 1,
    });

    const res = await POST(request("SAM@example.com"));

    await expect(res.json()).resolves.toEqual({ ok: true, delivery: "sent" });
    // The lookup is lower-cased, whitespace-trimmed, and compared with the
    // same normalisation login uses.
    const [strings, ...values] = sql.mock.calls[0];
    expect((strings as string[]).join("?")).toContain("lower(btrim(email))");
    expect(values).toEqual(["sam@example.com"]);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "Sam@Example.com",
      expect.stringContaining("/reset?token="),
    );
  });

  it("answers identically for an unknown address", async () => {
    sql.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await POST(request("nobody@example.com"));

    await expect(res.json()).resolves.toEqual({ ok: true, delivery: "sent" });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("does not reveal a send failure (that would out the address)", async () => {
    sql.mockResolvedValueOnce({
      rows: [{ id: "u1", email: "sam@example.com" }],
      rowCount: 1,
    });
    sendPasswordResetEmail.mockRejectedValueOnce(new Error("Resend error 401"));

    const res = await POST(request("sam@example.com"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, delivery: "sent" });
  });
});
