'use client';


import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/styles/theme';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '@/lib/createEmotionCache';

const clientSideEmotionCache = createEmotionCache();

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={clientSideEmotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
} 