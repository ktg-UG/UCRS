'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/styles/theme';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '@/lib/createEmotionCache';
import { useMemo } from 'react';
import { useLiff } from '@/hooks/useLiff'; // 作成したフックをインポート

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const emotionCache = useMemo(() => createEmotionCache(), []);
  
  // useLiffフックを呼び出すことで、このレイアウト内でLIFFが初期化される
  useLiff();

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <main style={{ padding: '1rem' }}> {/* パディングを調整 */}
          {children}
        </main>
      </ThemeProvider>
    </CacheProvider>
  );
}