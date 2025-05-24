"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { logger } from "../../app/config/logger";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme; // Allow configurable default theme
}

export function ThemeProvider({ 
  children, 
  defaultTheme = (["light", "dark"].includes(process.env.NEXT_PUBLIC_DEFAULT_THEME as string) 
    ? process.env.NEXT_PUBLIC_DEFAULT_THEME 
    : "light") as Theme 
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme as Theme);
  const [mounted, setMounted] = useState(false);

  // Helper function to get system theme preference
  const getSystemTheme = (): Theme => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return defaultTheme as Theme;
  };

  // Initialize theme and apply smooth transitions
  useEffect(() => {
    try {
      // Add transition styles for smooth theme changes
      const style = document.createElement("style");
      style.innerHTML = `
        html, body, * {
          transition: background-color 0.3s ease, color 0.3s ease;
        }
      `;
      document.head.appendChild(style);

      // Get initial theme: localStorage > system preference > default
      let initialTheme: Theme = defaultTheme as Theme;
      try {
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        if (savedTheme && ["light", "dark"].includes(savedTheme)) {
          initialTheme = savedTheme;
        } else {
          initialTheme = getSystemTheme();
        }
      } catch (error) {
        logger.error("Failed to access localStorage for theme", { error });
        initialTheme = getSystemTheme();
      }

      setTheme(initialTheme);
      document.documentElement.classList.toggle("dark", initialTheme === "dark");
      setMounted(true);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        try {
          localStorage.setItem("theme", newTheme);
          document.documentElement.classList.toggle("dark", newTheme === "dark");
          logger.info("System theme changed", { newTheme });
        } catch (error) {
          logger.error("Failed to save theme on system change", { error });
        }
      };

      mediaQuery.addEventListener("change", handleSystemThemeChange);
      return () => {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
        document.head.removeChild(style);
      };
    } catch (error) {
      logger.error("Theme initialization failed", { error });
      setMounted(true); // Ensure rendering proceeds even on error
    }
  }, []);

  const toggleTheme = () => {
    try {
      const newTheme = theme === "light" ? "dark" : "light";
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      logger.info("Theme toggled", { newTheme });
    } catch (error) {
      logger.error("Failed to toggle theme", { error });
    }
  };

  // Render fallback during hydration to avoid blank screen
  if (!mounted) {
    return <div className="min-h-screen" aria-hidden="true">{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}