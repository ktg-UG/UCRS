import { ReactNode } from 'react';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'カレンダー',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.8/main.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
