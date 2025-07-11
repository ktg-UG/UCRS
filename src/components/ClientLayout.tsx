"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/styles/theme";
import { CacheProvider } from "@emotion/react";
import createEmotionCache from "@/lib/createEmotionCache";
import { useMemo } from "react";
import AdminMenu from "./AdminMenu";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const emotionCache = useMemo(() => createEmotionCache(), []);

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AdminMenu />
        <main style={{ padding: "1rem" }}>{children}</main>
      </ThemeProvider>
    </CacheProvider>
  );
}
