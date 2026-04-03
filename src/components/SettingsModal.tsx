"use client";

import { useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { PromptScope, usePromptStore } from "@/store/usePromptStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { apiKey, rememberApiKey, themeMode, setApiKey, setRememberApiKey, setThemeMode, clearApiKey } = useSettingsStore();
  const { prompts, addPrompt, removePrompt } = usePromptStore();
  const [localKey, setLocalKey] = useState(apiKey);
  const [rememberLocal, setRememberLocal] = useState(rememberApiKey);
  const [themeLocal, setThemeLocal] = useState(themeMode);
  const [promptScope, setPromptScope] = useState<PromptScope>("chat");
  const [promptText, setPromptText] = useState("");

  const handleSave = () => {
    setRememberApiKey(rememberLocal);
    setThemeMode(themeLocal);
    setApiKey(localKey);
    onClose();
  };

  const handleClear = () => {
    setLocalKey("");
    setRememberLocal(false);
    setRememberApiKey(false);
    clearApiKey();
  };

  const scopeLabelMap: Record<PromptScope, string> = {
    chat: "文本对话",
    voice: "语音生成",
    video: "视频生成",
    image: "图片生成",
    music: "音乐生成",
  };
  const scopedPrompts = prompts
    .filter((item) => item.scope === promptScope)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>支持主题模式、API Key 持久化与提示词管理。</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="theme-mode">主题模式</Label>
              <Select id="theme-mode" value={themeLocal} onChange={(e) => setThemeLocal(e.currentTarget.value as "system" | "light" | "dark")}>
                <option value="system">跟随系统</option>
                <option value="light">浅色模式</option>
                <option value="dark">深色模式</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">MiniMax API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={localKey}
                onChange={(e) => setLocalKey(e.currentTarget.value)}
                placeholder="请输入您的 API Key"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/70">
              <Label htmlFor="remember-key" className="text-sm">记住 API Key（便携版建议开启）</Label>
              <Switch
                id="remember-key"
                checked={rememberLocal}
                onCheckedChange={(checked) => setRememberLocal(checked)}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-zinc-800">
            <div className="text-sm font-medium">提示词管理</div>
            <div className="space-y-2">
              <Label htmlFor="prompt-scope">功能模块</Label>
              <Select id="prompt-scope" value={promptScope} onChange={(e) => setPromptScope(e.currentTarget.value as PromptScope)}>
                {Object.entries(scopeLabelMap).map(([scope, label]) => (
                  <option key={scope} value={scope}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Input
                value={promptText}
                onChange={(e) => setPromptText(e.currentTarget.value)}
                placeholder={`新增${scopeLabelMap[promptScope]}提示词`}
              />
              <Button
                type="button"
                onClick={() => {
                  if (!promptText.trim()) {
                    return;
                  }
                  addPrompt(promptScope, promptText);
                  setPromptText("");
                }}
              >
                添加
              </Button>
            </div>
            <div className="max-h-44 overflow-y-auto space-y-2">
              {scopedPrompts.length === 0 ? (
                <div className="text-xs text-slate-500 dark:text-zinc-400">暂无提示词</div>
              ) : (
                scopedPrompts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-2 py-1.5 dark:border-zinc-800">
                    <span className="text-xs text-slate-700 dark:text-zinc-300 line-clamp-2">{item.text}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => removePrompt(item.id)}>
                      删除
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="destructive" onClick={handleClear}>清空密钥</Button>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
