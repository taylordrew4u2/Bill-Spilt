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
      // Password-recovery pages must be reachable while logged out.
      const isRecoveryPage = p.startsWith("/forgot") || p.startsWith("/reset");

      if (isLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/home", nextUrl));
        }
        return true;
      }
      if (isRecoveryPage) return true;
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
