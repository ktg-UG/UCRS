import type { Metadata } from "next";
//import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
//import ClientLayout from '../components/ClientLayout';

export const metadata: Metadata = {
  title: "Unite Court Reservation App",
  description: "ユナイトコート予約システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <ClientLayout>
          {children}    
        </ClientLayout>
      </body>
    </html>
  );
}
