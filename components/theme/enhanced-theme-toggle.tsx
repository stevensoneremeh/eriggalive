"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedThemeToggleProps {
  variant?: "default" | "compact" | "dropdown"
  className?: string
}

export function EnhancedThemeToggle({ variant = "default", className }: EnhancedThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        <div className="w-8 h-8 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  const themes = [
    { key: "light", icon: Sun, label: "Light" },
    { key: "dark", icon: Moon, label: "Dark" },
    { key: "system", icon: Monitor, label: "System" },
  ]

  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
          setTheme(nextTheme)
        }}
        className={cn("transition-all duration-200", className)}
        title={`Switch to ${theme === "light" ? "dark" : theme === "dark" ? "system" : "light"} mode`}
      >
        {theme === "light" && <Sun className="h-4 w-4" />}
        {theme === "dark" && <Moon className="h-4 w-4" />}
        {theme === "system" && <Monitor className="h-4 w-4" />}
      </Button>
    )
  }

  return (
    <div className={cn("flex items-center space-x-1 p-1 bg-muted rounded-lg", className)}>
      {themes.map(({ key, icon: Icon, label }) => (
        <Button
          key={key}
          variant={theme === key ? "default" : "ghost"}
          size="sm"
          onClick={() => setTheme(key)}
          className={cn("transition-all duration-200 px-3 py-1.5", theme === key && "shadow-sm")}
          title={`${label} mode`}
        >
          <Icon className="h-4 w-4 mr-1.5" />
          <span className="text-xs font-medium">{label}</span>
        </Button>
      ))}
    </div>
  )
}
