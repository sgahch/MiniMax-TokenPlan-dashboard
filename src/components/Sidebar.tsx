"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Mic, Video, Image as ImageIcon, Music, Settings } from "lucide-react";
import SettingsModal from "./SettingsModal";

const navItems = [
  { name: "文本对话", href: "/", icon: MessageSquare },
  { name: "语音生成", href: "/voice", icon: Mic },
  { name: "视频生成", href: "/video", icon: Video },
  { name: "图片生成", href: "/image", icon: ImageIcon },
  { name: "音乐生成", href: "/music", icon: Music },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col w-72 bg-white/70 dark:bg-zinc-900/70 border-r border-white/80 dark:border-zinc-800 h-screen backdrop-blur-xl">
        <div className="p-5 mb-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
            MiniMax 多模态客户端
          </h1>
          <p className="text-xs mt-1 text-gray-500 dark:text-zinc-400">多模态工作台</p>
        </div>

        <nav className="flex-1 px-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all border ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-700/60 shadow-sm font-medium"
                    : "text-gray-700 hover:bg-white/80 dark:text-gray-300 dark:hover:bg-zinc-800 border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/80 dark:border-zinc-800">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-zinc-700"
          >
            <Settings className="w-5 h-5" />
            <span>设置</span>
          </button>
        </div>
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
}
