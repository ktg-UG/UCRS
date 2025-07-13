import { ReactNode } from "react";
import Providers from "@/components/Providers";
import ClientLayout from "@/components/ClientLayout";
import { AdminProvider } from "@/contexts/AdminContext";
import NextAuthProvider from "@/components/NextAuthProvider"; // 1. 追加

export const metadata = {
  title: "Unite Court Reserve",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head></head>
      <body>
        <NextAuthProvider>
          {" "}
          {/* 2. ここで囲う */}
          <Providers>
            <AdminProvider>
              <ClientLayout>{children}</ClientLayout>
            </AdminProvider>
          </Providers>
        </NextAuthProvider>{" "}
        {/* 3. ここまで */}
      </body>
    </html>
  );
}
