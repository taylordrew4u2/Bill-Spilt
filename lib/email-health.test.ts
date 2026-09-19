import { describe, it, expect } from "vitest";
import {
  forgotDelivery,
  normalizeEmailHealth,
  shouldProbeProvider,
  type EmailHealth,
  type ForgotDelivery,
} from "@/lib/email-health";

// The recorded state a revoked Gmail app password leaves behind.
const failed: EmailHealth = {
  ok: false,
  at: "2026-09-19T20:42:02.000Z",
  message: "Invalid login: 535-5.7.8 Username and Password not accepted.",
};
const passed: EmailHealth = {
  ok: true,
  at: "2026-09-19T21:16:00.000Z",
  message: null,
};

describe("forgotDelivery", () => {
  it("reports a rejecting provider instead of promising a link", () => {
    // The bug this covers: a revoked app password left every environment
    // variable in place, so /forgot told people to check an inbox that no mail
    // could reach — and the usual advice ("reset your password") was a dead end.
    expect(forgotDelivery(true, failed)).toBe("provider-error");
  });

  it("is a function of provider state alone, so it can't leak who has an account", () => {
    // The route calls this *before* the account lookup, which is only safe if
    // there is nothing else for it to depend on. Hence the exhaustive table:
    // no combination of these two inputs can express anything about an address.
    const table: [boolean, EmailHealth | null, ForgotDelivery][] = [
      [false, null, "unconfigured"],
      [false, failed, "unconfigured"],
      [true, null, "sent"],
      [true, passed, "sent"],
      [true, failed, "provider-error"],
    ];
    for (const [configured, health, expected] of table) {
      const label = `configured=${configured} health=${
        health ? (health.ok ? "ok" : "failed") : "none"
      }`;
      expect(forgotDelivery(configured, health), label).toBe(expected);
    }
  });
});

describe("shouldProbeProvider", () => {
  it("re-probes an untested or failed provider", () => {
    // Re-probing (rather than trusting the failure forever) is what lets a
    // fixed app password start working without a redeploy.
    expect(shouldProbeProvider(null)).toBe(true);
    expect(shouldProbeProvider(failed)).toBe(true);
  });

  it("does not re-probe a provider that last passed", () => {
    expect(shouldProbeProvider(passed)).toBe(false);
  });
});

describe("normalizeEmailHealth", () => {
  it("reads the JSON text the column stores", () => {
    expect(normalizeEmailHealth(JSON.stringify(failed))).toEqual(failed);
  });

  it("also accepts a value the driver already parsed", () => {
    expect(normalizeEmailHealth({ ...failed })).toEqual(failed);
  });

  it("treats an unreadable record as no record at all", () => {
    // Never "broken" by accident: a garbled row must not block every reset.
    expect(normalizeEmailHealth("not json")).toBeNull();
    expect(normalizeEmailHealth(null)).toBeNull();
    expect(normalizeEmailHealth(42)).toBeNull();
    expect(normalizeEmailHealth('{"ok":true}')).toBeNull();
    expect(normalizeEmailHealth('{"ok":"yes","at":"2026-01-01T00:00:00Z"}')).toBeNull();
  });

  it("flattens a missing error message to null", () => {
    expect(
      normalizeEmailHealth('{"ok":false,"at":"2026-01-01T00:00:00Z"}'),
    ).toEqual({ ok: false, at: "2026-01-01T00:00:00Z", message: null });
  });
});
