import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PromptScope = "chat" | "voice" | "video" | "image" | "music";

export type PromptItem = {
  id: string;
  scope: PromptScope;
  text: string;
  createdAt: number;
};

interface PromptState {
  prompts: PromptItem[];
  addPrompt: (scope: PromptScope, text: string) => void;
  removePrompt: (id: string) => void;
}

const MAX_PROMPTS_PER_SCOPE = 40;

export const usePromptStore = create<PromptState>()(
  persist(
    (set) => ({
      prompts: [],
      addPrompt: (scope, text) =>
        set((state) => {
          const normalizedText = text.trim();
          if (!normalizedText) {
            return state;
          }
          const existed = state.prompts.find(
            (item) => item.scope === scope && item.text.toLowerCase() === normalizedText.toLowerCase()
          );
          if (existed) {
            return state;
          }
          const withNew = [{ id: crypto.randomUUID(), scope, text: normalizedText, createdAt: Date.now() }, ...state.prompts];
          const scoped = withNew.filter((item) => item.scope === scope).slice(0, MAX_PROMPTS_PER_SCOPE);
          const others = withNew.filter((item) => item.scope !== scope);
          return { prompts: [...scoped, ...others] };
        }),
      removePrompt: (id) => set((state) => ({ prompts: state.prompts.filter((item) => item.id !== id) })),
    }),
    {
      name: "minimax-prompts",
    }
  )
);
