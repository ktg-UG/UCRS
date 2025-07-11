import { ReactNode } from "react";
import Providers from "@/components/Providers";
import ClientLayout from "@/components/ClientLayout";
import { AdminProvider } from "@/contexts/AdminContext";

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
          <AdminProvider>
            <ClientLayout>{children}</ClientLayout>
          </AdminProvider>
        </Providers>
      </body>
    </html>
  );
}
