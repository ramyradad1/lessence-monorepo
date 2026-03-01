"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export const useV2Theme = () => useContext(ThemeContext);

export function V2ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem("v2-theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("v2-theme", next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div data-theme={theme} className="v2-themed">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
