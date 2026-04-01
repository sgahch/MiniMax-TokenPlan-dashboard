"use client";

import { MantineProvider, createTheme } from "@mantine/core";
import { ReactNode } from "react";

const theme = createTheme({
  primaryColor: "cyan",
  defaultRadius: "md",
});

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      {children}
    </MantineProvider>
  );
}
