import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { sql, ensureSchema } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { credentialsSchema, findUserForPassword } from "@/lib/credentials";

/**
 * Wrong email/password. Returning `null` from `authorize` produces the same
 * `CredentialsSignin` code, but throwing this explicitly keeps the "bad
 * credentials" path distinct from the "server is broken" path below, which the
 * login screen reports differently.
 */
class BadCredentials extends CredentialsSignin {
  code = "credentials";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) throw new BadCredentials();

        const { email, password } = parsed.data;

        let candidates: {
          id: string;
          email: string;
          name: string;
          password_hash: string;
        }[] = [];
        try {
          await ensureSchema();
          // Match the way every other door normalises the address: trimmed and
          // lower-cased. `btrim` on the stored side also rescues rows that were
          // imported with stray whitespace, which `lower(email) = ...` could
          // never match.
          //
          // Deliberately no `LIMIT 1`: `users.email` is UNIQUE only
          // case-sensitively, so the same address can exist as both
          // "Sam@x.com" and "sam@x.com". A reset or `set-password` updates one
          // row by id, and an unordered `LIMIT 1` may hand back the other —
          // which is how a perfectly correct password got rejected.
          const { rows } = await sql`
            SELECT id, email, name, password_hash
            FROM users WHERE lower(btrim(email)) = ${email}
          `;
          candidates = rows;
        } catch (e) {
          // Database unreachable/misconfigured. Let this propagate so the
          // client sees a server error instead of "incorrect password", which
          // sends people off resetting a password that was never wrong.
          console.error("[auth] login failed to reach the database:", e);
          throw new Error("Could not verify your login right now");
        }

        const user = await findUserForPassword(
          candidates,
          password,
          verifyPassword,
        );
        if (!user) throw new BadCredentials();

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
