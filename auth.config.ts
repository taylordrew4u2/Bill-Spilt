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
    p.startsWith("/terms")
  );
}

/**
 * Edge-safe auth config. Contains no database or bcrypt access so it can run
 * in the middleware (Edge runtime). The Credentials provider with its Node-
 * only `authorize` lives in `auth.ts`.
 */
export const authConfig = {
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
