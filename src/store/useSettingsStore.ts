import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  apiKey: string;
  rememberApiKey: boolean;
  themeMode: "system" | "light" | "dark";
  setApiKey: (key: string) => void;
  setRememberApiKey: (remember: boolean) => void;
  setThemeMode: (mode: "system" | "light" | "dark") => void;
  clearApiKey: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      rememberApiKey: false,
      themeMode: "system",
      setApiKey: (key) => set({ apiKey: key }),
      setRememberApiKey: (rememberApiKey) => set((state) => ({
        rememberApiKey,
        apiKey: rememberApiKey ? state.apiKey : "",
      })),
      setThemeMode: (themeMode) => set({ themeMode }),
      clearApiKey: () => set({ apiKey: '' }),
    }),
    {
      name: 'minimax-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apiKey: state.rememberApiKey ? state.apiKey : "",
        rememberApiKey: state.rememberApiKey,
        themeMode: state.themeMode,
      }),
    }
  )
);
