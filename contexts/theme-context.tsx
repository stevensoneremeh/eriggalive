"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  resolvedTheme: "dark" | "light"
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark")
  const [isLoading, setIsLoading] = useState(true)

  // Get system theme preference
  const getSystemTheme = (): "dark" | "light" => {
    if (typeof window === "undefined") return "dark"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme
    const systemTheme = getSystemTheme()

    if (savedTheme && ["dark", "light", "system"].includes(savedTheme)) {
      setTheme(savedTheme)
      setResolvedTheme(savedTheme === "system" ? systemTheme : savedTheme)
    } else {
      setTheme("system")
      setResolvedTheme(systemTheme)
    }

    setIsLoading(false)
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        setResolvedTheme(e.matches ? "dark" : "light")
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  // Apply theme to document
  useEffect(() => {
    if (isLoading) return

    const root = document.documentElement
    const newResolvedTheme = theme === "system" ? getSystemTheme() : theme

    // Remove existing theme classes
    root.classList.remove("light", "dark")

    // Add new theme class
    root.classList.add(newResolvedTheme)

    // Update resolved theme
    setResolvedTheme(newResolvedTheme)

    // Save to localStorage
    localStorage.setItem("theme", theme)

    // Set color-scheme for better browser integration
    root.style.colorScheme = newResolvedTheme
  }, [theme, isLoading])

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    resolvedTheme,
    isLoading,
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
