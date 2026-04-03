"use client";

import { ReactNode, useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function AppProviders({ children }: { children: ReactNode }) {
  const themeMode = useSettingsStore((state) => state.themeMode);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark = themeMode === "dark" || (themeMode === "system" && media.matches);
      root.classList.toggle("dark", isDark);
    };

    applyTheme();
    const listener = () => applyTheme();
    media.addEventListener("change", listener);
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [themeMode]);

  return <>{children}</>;
}
