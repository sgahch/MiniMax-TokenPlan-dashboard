"use client";

import { useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Button, Modal, PasswordInput, Stack, Switch, Text } from "@mantine/core";

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
    <Modal opened onClose={onClose} title="设置" centered size="lg" radius="lg">
      <Stack gap="md">
        <PasswordInput
          label="MiniMax API Key"
          value={localKey}
          onChange={(e) => setLocalKey(e.currentTarget.value)}
          placeholder="请输入您的 API Key"
        />
        <Text c="dimmed" size="xs">
          默认仅保存在当前会话，关闭浏览器后自动清除。
        </Text>
        <Switch
          checked={rememberLocal}
          onChange={(e) => setRememberLocal(e.currentTarget.checked)}
          label="记住 API Key（不推荐）"
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="light" color="red" onClick={handleClear}>清空密钥</Button>
          <Button variant="default" onClick={onClose}>取消</Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </Stack>
    </Modal>
  );
}
