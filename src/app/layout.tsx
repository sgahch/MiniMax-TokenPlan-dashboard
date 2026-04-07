import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TokenPlanStatusBar from "@/components/TokenPlanStatusBar";
import AppProviders from "@/components/AppProviders";

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
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--foreground)] flex h-screen overflow-hidden">
        <AppProviders>
          <Sidebar />
          <main className="flex-1 h-full overflow-y-auto p-4 md:p-5 pb-36">
            {children}
          </main>
          <TokenPlanStatusBar />
        </AppProviders>
      </body>
    </html>
  );
}
