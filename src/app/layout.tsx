import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MiniMax 多模态 AI 客户端",
  description: "基于 MiniMax API 的多模态 AI 客户端，支持文本、语音、视频、图片、音乐等功能",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-slate-100 dark:bg-zinc-950 text-black dark:text-white flex h-screen overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto p-4 md:p-5">
          {children}
        </main>
      </body>
    </html>
  );
}
