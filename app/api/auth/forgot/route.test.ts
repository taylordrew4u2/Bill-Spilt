import { describe, it, expect, vi, beforeEach } from "vitest";

const sql = vi.fn();
const emailConfigured = vi.fn();
const sendPasswordResetEmail = vi.fn();

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
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmail(...args),
}));

const { POST } = await import("./route");

const request = (email: string) =>
  new Request("https://example.com/api/auth/forgot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

describe("POST /api/auth/forgot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    emailConfigured.mockReturnValue(true);
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

  it("sends a reset link to the address as stored, matched case-insensitively", async () => {
    sql.mockResolvedValueOnce({
      rows: [{ id: "u1", email: "Sam@Example.com" }],
      rowCount: 1,
    });

    const res = await POST(request("SAM@example.com"));

    await expect(res.json()).resolves.toEqual({ ok: true, delivery: "sent" });
    // The lookup is lower-cased and compared with lower(email).
    const [strings, ...values] = sql.mock.calls[0];
    expect((strings as string[]).join("?")).toContain("lower(email)");
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
