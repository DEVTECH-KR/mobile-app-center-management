"use client";

import { useAuth } from "@/lib/auth";
import { ReactNode, useEffect, useState, createContext, useContext } from "react";

type Language = "en" | "fr";

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({
  language: "en",
  setLanguage: () => {},
});

export function UserLanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    if (user?.preferences?.language) {
      setLanguage(user.preferences.language as Language);
    }
  }, [user]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
