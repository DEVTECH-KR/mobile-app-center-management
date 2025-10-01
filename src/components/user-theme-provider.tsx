// src/components/user-theme-provider.tsx
"use client";

import { useAuth } from "@/lib/auth";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { ReactNode, useEffect, useState } from "react";

export function UserThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  // Sync avec user.preferences.theme
  useEffect(() => {
    if (user?.preferences?.theme) {
      setTheme(user.preferences.theme);
    } else {
      setTheme("system");
    }
  }, [user]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      value={{ light: "light", dark: "dark" }}
      forcedTheme={theme === "system" ? undefined : theme}
    >
      {children}
    </NextThemesProvider>
  );
}
