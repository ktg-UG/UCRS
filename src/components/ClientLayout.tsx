'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/styles/theme';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '@/lib/createEmotionCache';
import { useMemo } from 'react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const emotionCache = useMemo(() => createEmotionCache(), []);

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <main style={{ padding: '2rem' }}>
          {children}
        </main>
      </ThemeProvider>
    </CacheProvider>
  );
} 