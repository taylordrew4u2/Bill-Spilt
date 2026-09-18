import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Mirrors the schema `authorize` uses in auth.ts. Kept here because importing
 * auth.ts pulls in NextAuth (and next/server) for what is a pure input rule.
 */
const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const parse = (email: string, password = "pw") =>
  credentialsSchema.safeParse({ email, password });

describe("login credentials", () => {
  it("accepts an address a phone keyboard padded with a space", () => {
    // The bug this covers: an untrimmed value fails .email(), which reached
    // the user as "Incorrect email or password" on a correct password.
    for (const raw of ["sam@example.com ", " sam@example.com", "  sam@example.com  "]) {
      const got = parse(raw);
      expect(got.success, `rejected ${JSON.stringify(raw)}`).toBe(true);
      expect(got.success && got.data.email).toBe("sam@example.com");
    }
  });

  it("normalises case the same way sign-up does", () => {
    const got = parse("Sam@Example.COM");
    expect(got.success && got.data.email).toBe("sam@example.com");
  });

  it("still rejects something that isn't an address", () => {
    expect(parse("not-an-email").success).toBe(false);
    expect(parse("").success).toBe(false);
    expect(parse("   ").success).toBe(false);
  });

  it("leaves the password byte-for-byte alone", () => {
    // Spaces are legal in a password; trimming would lock those people out.
    const got = credentialsSchema.safeParse({
      email: "sam@example.com",
      password: "  pass word  ",
    });
    expect(got.success && got.data.password).toBe("  pass word  ");
  });
});
