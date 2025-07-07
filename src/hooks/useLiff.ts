"use client";

import { useState, useEffect } from "react";

// LIFFの型定義
declare const liff: any;

export const useLiff = () => {
  const [liffObject, setLiffObject] = useState<any>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [liffProfile, setLiffProfile] = useState<any>(null);

  useEffect(() => {
    // LIFFの初期化処理
    const initializeLiff = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_LIFF_ID) {
          throw new Error("LIFF ID is not set.");
        }

        const liffModule = await import("@line/liff");
        const liff = liffModule.default;

        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID });

        setLiffObject(liff);

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLiffProfile(profile);
        }
      } catch (error: any) {
        console.error("LIFF initialization failed", error);
        setLiffError(error.toString());
      }
    };

    initializeLiff();
  }, []);

  return { liffObject, liffError, liffProfile };
};
