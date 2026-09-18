import { describe, it, expect } from "vitest";
import { credentialsSchema, findUserForPassword } from "@/lib/credentials";

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

describe("findUserForPassword", () => {
  // Stand-in for bcrypt: the rule under test is *which account* gets picked,
  // not the hashing itself.
  const verify = (plain: string, hash: string) =>
    Promise.resolve(hash === `hashed:${plain}`);

  // One address stored twice, in two casings, with different passwords — the
  // shape imported data (or a row written before the case-insensitive checks
  // landed) leaves behind, since `users.email` is UNIQUE only case-sensitively.
  const rows = [
    { id: "a", email: "Dup@example.com", password_hash: "hashed:oldpass" },
    { id: "b", email: "dup@example.com", password_hash: "hashed:newpass" },
  ];

  it("picks the account whose hash matches, not just the first row", async () => {
    // Regression: an unordered `LIMIT 1` could hand back row a, so a password
    // set on row b — by a reset or `set-password` — was reported as wrong.
    const found = await findUserForPassword(rows, "newpass", verify);
    expect(found?.id).toBe("b");
  });

  it("still finds a password set on the first row", async () => {
    const found = await findUserForPassword(rows, "oldpass", verify);
    expect(found?.id).toBe("a");
  });

  it("returns undefined when no candidate holds the password", async () => {
    expect(await findUserForPassword(rows, "nope", verify)).toBeUndefined();
  });

  it("returns undefined for no candidates at all", async () => {
    const none: { password_hash: string }[] = [];
    expect(await findUserForPassword(none, "pw", verify)).toBeUndefined();
  });
});
