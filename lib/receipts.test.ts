import { describe, it, expect, vi, beforeEach } from "vitest";

const sql = vi.fn();
vi.mock("@/lib/db", () => ({ sql: (...a: unknown[]) => sql(...a) }));

const { storeReceipt, readReceipt, typeFromName, ALLOWED_TYPES, MAX_BYTES } =
  await import("./receipts");

/** The text of a tagged-template call, with $1/$2… where the values went. */
const queryText = (call: unknown[]) => (call[0] as string[]).join("?");

describe("receipt storage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("moves bytes in as base64 and returns a path carrying the extension", async () => {
    sql.mockResolvedValueOnce({ rows: [{ id: "11111111-2222-3333-4444-555555555555" }], rowCount: 1 });
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01]);

    const { path } = await storeReceipt({
      householdId: "h1",
      uploadedBy: "u1",
      contentType: "application/pdf",
      bytes,
    });

    // The UI decides PDF vs. image preview from the suffix, so it must be there.
    expect(path).toBe("/api/receipts/11111111-2222-3333-4444-555555555555.pdf");
    const [, ...values] = sql.mock.calls[0];
    expect(queryText(sql.mock.calls[0])).toContain("decode(");
    expect(values).toContain(bytes.toString("base64"));
    expect(values).toContain(bytes.byteLength);
  });

  it("round-trips bytes unchanged", async () => {
    const bytes = Buffer.from([0x00, 0x10, 0x7f, 0x80, 0xff]);
    sql.mockResolvedValueOnce({
      rows: [{ household_id: "h1", content_type: "image/png", b64: bytes.toString("base64") }],
      rowCount: 1,
    });

    const got = await readReceipt("11111111-2222-3333-4444-555555555555");

    expect(got?.contentType).toBe("image/png");
    expect(got?.householdId).toBe("h1");
    expect([...(got?.bytes ?? [])]).toEqual([...bytes]);
    // Read back as text, never as raw binary — the two drivers disagree there.
    expect(queryText(sql.mock.calls[0])).toContain("encode(data, 'base64')");
  });

  it("returns null for an id that isn't stored", async () => {
    sql.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    await expect(readReceipt("11111111-2222-3333-4444-555555555555")).resolves.toBeNull();
  });

  it("falls back to the filename when a browser sends no type", () => {
    expect(typeFromName("IMG_0042.HEIC")).toBe("image/heic");
    expect(typeFromName("statement.pdf")).toBe("application/pdf");
    expect(typeFromName("notes.txt")).toBe("");
    // Every type the route accepts must map to an extension for the path.
    for (const type of Object.keys(ALLOWED_TYPES)) {
      expect(ALLOWED_TYPES[type]).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("caps uploads well under a free database tier", () => {
    expect(MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});
