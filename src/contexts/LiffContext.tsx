'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ★ LIFFの型定義のインポート方法を修正 ★
import liff from '@line/liff';
import type { Liff } from '@line/liff';

// Contextに渡す値の型定義
interface LiffContextType {
  liff: Liff | null;
  profile: any | null; // Profile型も利用可能
  error: string | null;
  isLoggedIn: boolean;
}

// Contextを作成
const LiffContext = createContext<LiffContextType>({
  liff: null,
  profile: null,
  error: null,
  isLoggedIn: false,
});

// このカスタムフックを使って、どのコンポーネントからでもLIFFの情報を参照できるようにする
export const useLiff = () => useContext(LiffContext);

// LIFFの初期化と状態管理を行うプロバイダーコンポーネント
export const LiffProvider = ({ children }: { children: ReactNode }) => {
  const [liffObject, setLiffObject] = useState<Liff | null>(null);
  const [liffProfile, setLiffProfile] = useState<any>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_LIFF_ID) {
          throw new Error('LIFF IDが設定されていません。環境変数を確認してください。');
        }

        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID });
        setLiffObject(liff);
        
        if (liff.isLoggedIn()) {
          setIsLoggedIn(true);
          const profile = await liff.getProfile();
          setLiffProfile(profile);
        }
        // ログインしていない場合は、ページ側でログインを促す
        
      } catch (e: any) {
        console.error('LIFF initialization failed', e);
        setLiffError(e.toString());
      }
    };

    initializeLiff();
  }, []);

  const value = {
    liff: liffObject,
    profile: liffProfile,
    error: liffError,
    isLoggedIn: isLoggedIn,
  };

  return (
    <LiffContext.Provider value={value}>
      {children}
    </LiffContext.Provider>
  );
};