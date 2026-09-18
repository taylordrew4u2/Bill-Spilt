import { z } from "zod";

/**
 * Sign-up and password recovery both trim and lower-case the address before
 * touching the database; login has to normalise it exactly the same way or an
 * account is reachable by one door and not the other. Phone keyboards and
 * autofill routinely append a space after an email, and an untrimmed value
 * fails `.email()` outright — which surfaced as "Incorrect email or password"
 * on a password that was perfectly correct.
 *
 * The password is deliberately left alone: a space is a legitimate character
 * in one, and trimming would lock out anyone whose password starts or ends
 * with one.
 *
 * Lives here rather than in `auth.ts` so the schema can be tested directly —
 * importing `auth.ts` pulls in NextAuth (and `next/server`) for what is a pure
 * input rule.
 */
export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

/**
 * Pick the account whose stored password hash matches, or `undefined`.
 *
 * The login lookup can legitimately return more than one row for the same
 * address: `users.email` is UNIQUE, but only case-sensitively, so imported data
 * can hold `Sam@x.com` and `sam@x.com` side by side. A password reset or
 * `npm run set-password` updates a single row by id, which is not necessarily
 * the one an unordered `LIMIT 1` hands back — and the user was told their
 * password was wrong while resetting it changed nothing. Verifying against
 * every candidate instead of trusting one arbitrary row is what fixes that.
 *
 * The comparison is injected so the rule is testable without bcrypt or a
 * database.
 */
export async function findUserForPassword<T extends { password_hash: string }>(
  candidates: readonly T[],
  password: string,
  verify: (plain: string, hash: string) => Promise<boolean>,
): Promise<T | undefined> {
  for (const candidate of candidates) {
    if (await verify(password, candidate.password_hash)) return candidate;
  }
  return undefined;
}
