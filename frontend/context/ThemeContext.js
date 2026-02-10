"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  fetchUserSettings,
  updateUserSettingsAction,
} from "@/actions/userActions";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const initTheme = async () => {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle(
          "dark",
          savedTheme === "dark",
        );
      }
      const result = await fetchUserSettings();
      if (result.success && result.data.theme) {
        const dbTheme = result.data.theme;
        if (dbTheme !== savedTheme) {
          setTheme(dbTheme);
          localStorage.setItem("theme", dbTheme);
          document.documentElement.classList.toggle("dark", dbTheme === "dark");
        }
      }
    };
    initTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");

    await updateUserSettingsAction({ theme: newTheme });
  };

  if (!isMounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
