import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  apiKey: string;
  rememberApiKey: boolean;
  setApiKey: (key: string) => void;
  setRememberApiKey: (remember: boolean) => void;
  clearApiKey: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      rememberApiKey: false,
      setApiKey: (key) => set({ apiKey: key }),
      setRememberApiKey: (rememberApiKey) => set({ rememberApiKey }),
      clearApiKey: () => set({ apiKey: '' }),
    }),
    {
      name: 'minimax-settings',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => (state.rememberApiKey ? state : { apiKey: '', rememberApiKey: false }),
    }
  )
);
