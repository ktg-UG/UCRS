import { ReactNode } from 'react';
import Providers from '@/components/Providers';
import ClientLayout from '@/components/ClientLayout'; // ClientLayoutをインポート

export const metadata = {
  title: 'Unite Court Reserve',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* LIFF SDKのスクリプトは不要になったので削除 */}
      </head>
      <body>
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}