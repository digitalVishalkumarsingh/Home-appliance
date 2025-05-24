"use client";

import { useTheme } from "@/app/contexts/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";
import { motion } from "framer-motion";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`p-2 rounded-full ${
        theme === "dark" 
          ? "bg-gray-700 text-yellow-300" 
          : "bg-blue-100 text-blue-800"
      } ${className}`}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <FaSun className="w-5 h-5" />
      ) : (
        <FaMoon className="w-5 h-5" />
      )}
    </motion.button>
  );
}
