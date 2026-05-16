import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import type { Session, User } from "next-auth";
import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { loginSchema } from "@/lib/validations/auth.schema";
import { prisma } from "@/server/db/client";

const initNextAuth = NextAuth as unknown as (config: Record<string, unknown>) => {
  handlers: { GET: (req: Request) => Promise<Response>; POST: (req: Request) => Promise<Response> };
  auth: (...args: unknown[]) => Promise<Session | null>;
  signIn: (...args: unknown[]) => Promise<unknown>;
  signOut: (...args: unknown[]) => Promise<unknown>;
};

/** Trim + одна пара окружающих кавычек (типичный копипаст из некоторых редакторов/.env.example) */
function readEnvCred(value: string | undefined): string | undefined {
  let t = value?.trim();
  if (!t) return undefined;
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }
  return t || undefined;
}

const googleClientId =
  readEnvCred(process.env.GOOGLE_CLIENT_ID) || readEnvCred(process.env.AUTH_GOOGLE_ID);
const googleClientSecret =
  readEnvCred(process.env.GOOGLE_CLIENT_SECRET) || readEnvCred(process.env.AUTH_GOOGLE_SECRET);
const hasGoogleOAuth = Boolean(googleClientId && googleClientSecret);

const appleClientId =
  readEnvCred(process.env.APPLE_ID) ||
  readEnvCred(process.env.AUTH_APPLE_ID) ||
  readEnvCred(process.env.APPLE_CLIENT_ID);
const appleClientSecret =
  readEnvCred(process.env.APPLE_SECRET) ||
  readEnvCred(process.env.AUTH_APPLE_SECRET) ||
  readEnvCred(process.env.APPLE_CLIENT_SECRET);
const hasAppleOAuth = Boolean(appleClientId && appleClientSecret);

const authSecret = readEnvCred(process.env.AUTH_SECRET) || readEnvCred(process.env.NEXTAUTH_SECRET);

/**
 * Auth.js без secret показывает только «Configuration» / server error. В dev даём fallback;
 * в production secret обязателен.
 */
const resolvedSecret =
  authSecret ??
  (process.env.NODE_ENV !== "production"
    ? "development-only-secret-do-not-use-in-production"
    : undefined);

if (!authSecret && process.env.NODE_ENV !== "production") {
  console.warn(
    "[auth] AUTH_SECRET / NEXTAUTH_SECRET не заданы — используется небезопасный dev-secret. Задайте секрет в .env."
  );
}

export const { handlers, auth, signIn, signOut } = initNextAuth({
  secret: resolvedSecret,
  // Обязательно /api/auth (App Router) — иначе Google получает redirect_uri без /api/auth → redirect_uri_mismatch
  basePath: "/api/auth",
  // Нужен для корректного origin/callback в dev (LAN, прокси, отличие localhost vs 127.0.0.1)
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60
  },
  providers: [
    ...(hasGoogleOAuth
      ? [
          Google({
            clientId: googleClientId as string,
            clientSecret: googleClientSecret as string
          })
        ]
      : []),
    ...(hasAppleOAuth
      ? [
          Apple({
            clientId: appleClientId as string,
            clientSecret: appleClientSecret as string
          })
        ]
      : []),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember", type: "text" }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password
        });
        if (!parsed.success) return null;

        const remember =
          credentials?.remember === "true" ||
          credentials?.remember === "on" ||
          credentials?.remember === "1";

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: { id: true, email: true, name: true, image: true, passwordHash: true, role: true }
        });

        if (!user?.passwordHash) return null;
        const isValid = await compare(parsed.data.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          rememberMe: remember
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.sub = (user as User & { id?: string }).id ?? token.sub;
        token.role = (user as { role?: string }).role ?? "USER";
        const remember = user.rememberMe === true;
        token.rememberMe = remember;
        const maxSec = remember ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
        token.exp = Math.floor(Date.now() / 1000) + maxSec;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
});
