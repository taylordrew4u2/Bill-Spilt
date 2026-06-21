import type { NextAuthConfig } from "next-auth";

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
      const isLoginPage = p.startsWith("/login") || p.startsWith("/register");
      // Public, logged-out-reachable pages: the marketing home, password
      // recovery, and legal pages.
      const isPublicPage =
        p === "/" ||
        p.startsWith("/forgot") ||
        p.startsWith("/reset") ||
        p.startsWith("/privacy") ||
        p.startsWith("/terms");

      if (isLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/home", nextUrl));
        }
        return true;
      }
      if (isPublicPage) return true;
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
