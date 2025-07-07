import { ReactNode } from 'react';
import Providers from '@/components/Providers';
import ClientLayout from '@/components/ClientLayout';
import { LiffProvider } from '@/contexts/LiffContext'; // 作成したLiffProviderをインポート

export const metadata = {
  title: 'Unite Court Reserve',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head></head>
      <body>
        <Providers>
          <LiffProvider> {/* ★ LiffProviderで囲む ★ */}
            <ClientLayout>
              {children}
            </ClientLayout>
          </LiffProvider>
        </Providers>
      </body>
    </html>
  );
}