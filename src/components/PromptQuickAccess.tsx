"use client";

import { useMemo, useState } from "react";
import { PromptScope, usePromptStore } from "@/store/usePromptStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type PromptQuickAccessProps = {
  scope: PromptScope;
  value: string;
  onUsePrompt: (value: string) => void;
};

export default function PromptQuickAccess({ scope, value, onUsePrompt }: PromptQuickAccessProps) {
  const { prompts, addPrompt } = usePromptStore();
  const [selectedId, setSelectedId] = useState("");

  const scopedPrompts = useMemo(
    () => prompts.filter((item) => item.scope === scope).sort((a, b) => b.createdAt - a.createdAt),
    [prompts, scope]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select
          value={selectedId}
          onChange={(e) => {
            const id = e.currentTarget.value;
            setSelectedId(id);
            const found = scopedPrompts.find((item) => item.id === id);
            if (found) {
              onUsePrompt(found.text);
            }
          }}
        >
          <option value="">快速选择提示词</option>
          {scopedPrompts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.text.length > 48 ? `${item.text.slice(0, 48)}...` : item.text}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!value.trim()) {
              return;
            }
            addPrompt(scope, value);
          }}
        >
          收藏当前
        </Button>
      </div>
      {scopedPrompts.length === 0 && (
        <Input value="暂无提示词，可输入后点“收藏当前”" readOnly className="h-8 text-xs text-slate-500" />
      )}
    </div>
  );
}
