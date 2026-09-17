import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { sql, ensureSchema } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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

        let user: { id: string; email: string; name: string; password_hash: string } | undefined;
        try {
          await ensureSchema();
          // Compare case-insensitively: sign-up lower-cases addresses now, but
          // accounts created before that (or imported) may be stored with
          // mixed case, and those users could never log back in.
          const { rows } = await sql`
            SELECT id, email, name, password_hash
            FROM users WHERE lower(email) = ${email.toLowerCase()} LIMIT 1
          `;
          user = rows[0];
        } catch (e) {
          // Database unreachable/misconfigured. Let this propagate so the
          // client sees a server error instead of "incorrect password", which
          // sends people off resetting a password that was never wrong.
          console.error("[auth] login failed to reach the database:", e);
          throw new Error("Could not verify your login right now");
        }

        if (!user) throw new BadCredentials();

        const ok = await verifyPassword(password, user.password_hash);
        if (!ok) throw new BadCredentials();

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
