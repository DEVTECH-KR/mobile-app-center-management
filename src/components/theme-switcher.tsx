// src/components/theme-switcher.tsx
'use client';

import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { user, setAuthUser } = useAuth();

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";

    // change le thème côté client
    setTheme(newTheme);

    // update DB si connecté
    if (user) {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const res = await fetch(`/api/users/${user.id}/preferences`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ theme: newTheme }),
        });

        if (!res.ok) throw new Error('Failed to update preferences');

        // update local context
        setAuthUser({
          ...user,
          preferences: { ...user.preferences, theme: newTheme },
        });
      } catch (err) {
        console.error('Error updating theme:', err);
      }
    }
  };

  return (
    <button onClick={toggleTheme}>
      {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
