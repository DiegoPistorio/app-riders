import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const { rows } = await pool.query(
          "SELECT id, nombre, email, password_hash FROM usuarios WHERE email = $1",
          [email.toLowerCase().trim()]
        );
        const usuario = rows[0];
        if (!usuario) return null;

        const valido = await bcrypt.compare(password, usuario.password_hash);
        if (!valido) return null;

        return { id: usuario.id, name: usuario.nombre, email: usuario.email };
      },
    }),
  ],
});
