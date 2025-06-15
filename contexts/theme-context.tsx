"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { useTheme as useNextTheme } from "next-themes"

type Theme = "dark" | "light" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  resolvedTheme: string | undefined
  systemTheme: string | undefined
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme()

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light")
    } else if (theme === "light") {
      setTheme("system")
    } else {
      setTheme("dark")
    }
  }

  const contextValue: ThemeContextType = {
    theme: theme as Theme,
    setTheme,
    toggleTheme,
    resolvedTheme,
    systemTheme,
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  const nextTheme = useNextTheme() // Always call useNextTheme

  if (context === undefined) {
    // Fallback to next-themes hook if custom context is not available
    return {
      theme: nextTheme.theme as Theme,
      setTheme: nextTheme.setTheme,
      toggleTheme: () => {
        if (nextTheme.theme === "dark") {
          nextTheme.setTheme("light")
        } else {
          nextTheme.setTheme("dark")
        }
      },
      resolvedTheme: nextTheme.resolvedTheme,
      systemTheme: nextTheme.systemTheme,
    }
  }
  return context
}
