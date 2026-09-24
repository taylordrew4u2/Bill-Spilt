import type { NextAuthConfig } from "next-auth";

/** The login/sign-up screens (reachable logged-out; bounce to /home if in). */
export function isAuthRoute(p: string): boolean {
  return p.startsWith("/login") || p.startsWith("/register");
}

/**
 * Public, logged-out-reachable pages: the marketing home, content/guides, the
 * free calculator, About/Contact, invite links (which route a logged-out
 * invitee on to sign-up), password recovery, and legal pages. Shared by the
 * `authorized` callback and the CSP middleware so gating stays in one place.
 */
export function isPublicRoute(p: string): boolean {
  return (
    p === "/" ||
    p.startsWith("/guide") ||
    p.startsWith("/split-calculator") ||
    p.startsWith("/about") ||
    p.startsWith("/contact") ||
    p.startsWith("/join") ||
    p.startsWith("/forgot") ||
    p.startsWith("/reset") ||
    p.startsWith("/privacy") ||
    p.startsWith("/terms") ||
    p.startsWith("/check")
  );
}

/**
 * Edge-safe auth config. Contains no database or bcrypt access so it can run
 * in the middleware (Edge runtime). The Credentials provider with its Node-
 * only `authorize` lives in `auth.ts`.
 */
export const authConfig = {
  /**
   * Trust the Host header when building callback URLs.
   *
   * Auth.js only trusts it automatically on Vercel (`VERCEL=1`) or in dev.
   * Anywhere else — a self-hosted box, Docker, a plain `npm start`, or Vercel
   * behind a proxy that rewrites the host — every sign-in attempt fails with
   * `UntrustedHost`, which reaches the browser as a generic "server
   * configuration" error and looks exactly like a wrong password.
   *
   * Safe here: auth is credentials-only (no OAuth provider to redirect a
   * spoofed host back to) and Auth.js still confines post-login redirects to
   * its own origin. Setting `AUTH_URL` to the canonical origin pins it further.
   */
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const p = nextUrl.pathname;

      if (isAuthRoute(p)) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/home", nextUrl));
        }
        return true;
      }
      if (isPublicRoute(p)) return true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // Added in auth.ts
} satisfies NextAuthConfig;
