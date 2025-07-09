import { ReactNode } from "react";
import Providers from "@/components/Providers";
import ClientLayout from "@/components/ClientLayout";
import { AdminProvider } from "@/contexts/AdminContext"; // AdminProviderをインポート

export const metadata = {
  title: "Unite Court Reserve",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head></head>
      <body>
        <Providers>
          {/* ↓↓↓ ここから変更 ↓↓↓ */}
          <AdminProvider>
            <ClientLayout>{children}</ClientLayout>
          </AdminProvider>
          {/* ↑↑↑ ここまで変更 ↑↑↑ */}
        </Providers>
      </body>
    </html>
  );
}
