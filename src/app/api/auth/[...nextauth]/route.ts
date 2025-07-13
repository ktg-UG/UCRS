import NextAuth, { AuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";
import { db } from "@/lib/drizzle";
import { members } from "@/../drizzle/schema";

const authOptions: AuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      // ログイン時にLINEのプロフィール情報があれば、トークンにID(sub)を追加
      if (profile) {
        token.id = profile.sub;
      }
      return token;
    },
    async session({ session, token }) {
      // JWTトークンのIDをセッションに含める
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
    async signIn({ user, profile }) {
      if (!profile || !user.name) {
        return false; // プロフィールがなければサインインを中止
      }

      try {
        // データベースにユーザー情報を登録または更新
        await db
          .insert(members)
          .values({
            name: user.name,
            lineUserId: profile.sub, // LINEのユーザーID
          })
          .onConflictDoUpdate({
            target: members.lineUserId,
            set: { name: user.name }, // 名前が変わっている可能性を考慮して更新
          });
        return true; // サインイン成功
      } catch (error) {
        console.error("SignIn - DB Error:", error);
        return false; // DBエラー時はサインインを中止
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
