"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useTheme as useNextTheme } from "next-themes"

interface ThemeContextType {
  theme: string | undefined
  setTheme: (theme: string) => void
  resolvedTheme: string | undefined
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const value = {
    theme,
    setTheme,
    resolvedTheme,
    isLoading: !mounted,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
