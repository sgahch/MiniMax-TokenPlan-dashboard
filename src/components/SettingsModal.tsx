"use client";

import { useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { X } from "lucide-react";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { apiKey, rememberApiKey, setApiKey, setRememberApiKey, clearApiKey } = useSettingsStore();
  const [localKey, setLocalKey] = useState(apiKey);
  const [rememberLocal, setRememberLocal] = useState(rememberApiKey);

  const handleSave = () => {
    setRememberApiKey(rememberLocal);
    setApiKey(localKey);
    onClose();
  };

  const handleClear = () => {
    setLocalKey("");
    setRememberLocal(false);
    setRememberApiKey(false);
    clearApiKey();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white/95 dark:bg-zinc-900/95 rounded-2xl shadow-2xl p-6 relative border border-white/60 dark:border-zinc-700/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          设置
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              MiniMax API Key
            </label>
            <input
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="请输入您的 API Key"
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-2">
              默认仅保存在当前会话，关闭浏览器后自动清除。
            </p>
          </div>
          <label className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-zinc-700 px-3 py-2.5 bg-gray-50 dark:bg-zinc-800/70">
            <span className="text-sm text-gray-700 dark:text-gray-200">记住 API Key（不推荐）</span>
            <input
              type="checkbox"
              checked={rememberLocal}
              onChange={(e) => setRememberLocal(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            清空密钥
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
