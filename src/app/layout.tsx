import { ReactNode } from 'react';
import Providers from '@/components/Providers';
import ClientLayout from '@/components/ClientLayout';

export const metadata = {
  title: 'Unite Court Reserve',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* LIFF SDKのscriptタグを削除 */}
      </head>
      <body>
        <Providers>
          {/* LiffProviderを削除し、ClientLayoutのみにする */}
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}