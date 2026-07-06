import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createKyselyAdapter } from "@/lib/auth-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: createKyselyAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials) return null;

        // Internal auto-signin after email OTP verification or login OTP verification
        if (
          (credentials.type === "verified" ||
            credentials.type === "login-otp-verified") &&
          credentials.userId
        ) {
          const user = await db
            .selectFrom("users")
            .where("id", "=", credentials.userId as string)
            .select(["id", "email", "username", "avatar_url"])
            .executeTakeFirst();
          if (!user) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.username,
            image: user.avatar_url,
          };
        }

        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const user = await db
          .selectFrom("users")
          .where("email", "=", parsed.data.email)
          .select(["id", "email", "username", "password_hash", "avatar_url"])
          .executeTakeFirst();

        if (!user?.password_hash) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.password_hash,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          image: user.avatar_url,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
