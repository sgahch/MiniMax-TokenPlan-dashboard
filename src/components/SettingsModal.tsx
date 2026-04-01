"use client";

import { useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
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
import { Switch } from "@/components/ui/switch";

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>默认仅保存在当前会话，关闭浏览器后自动清除。</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
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
            <Label htmlFor="remember-key" className="text-sm">记住 API Key（不推荐）</Label>
            <Switch
              id="remember-key"
              checked={rememberLocal}
              onCheckedChange={(checked) => setRememberLocal(checked)}
            />
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
