"use client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  variant?: "default" | "compact" | "icon-only"
  className?: string
}

export function ThemeToggle({ variant = "default", className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const currentTheme = resolvedTheme || theme

  if (variant === "icon-only") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
        className={cn("theme-toggle-button", className)}
        title={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
      >
        {currentTheme === "dark" ? <Sun className="h-5 w-5 text-theme-accent" /> : <Moon className="h-5 w-5" />}
      </Button>
    )
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center space-x-1 p-1 bg-muted rounded-lg", className)}>
        {[
          { value: "light", icon: Sun, label: "Light" },
          { value: "dark", icon: Moon, label: "Dark" },
          { value: "system", icon: Monitor, label: "Auto" },
        ].map(({ value, icon: Icon, label }) => (
          <Button
            key={value}
            variant={theme === value ? "default" : "ghost"}
            size="sm"
            onClick={() => setTheme(value)}
            className={cn(
              "theme-toggle-button px-2 py-1 h-8",
              theme === value && "bg-primary text-primary-foreground shadow-sm",
            )}
            title={`${label} mode`}
          >
            <Icon className="h-3 w-3" />
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {[
        { value: "light", icon: Sun, label: "Light" },
        { value: "dark", icon: Moon, label: "Dark" },
        { value: "system", icon: Monitor, label: "Auto" },
      ].map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant={theme === value ? "default" : "ghost"}
          size="sm"
          onClick={() => setTheme(value)}
          className={cn(
            "theme-toggle-button flex items-center gap-2 px-3 py-2",
            theme === value && "bg-primary text-primary-foreground shadow-sm",
          )}
          title={`${label} mode`}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">{label}</span>
        </Button>
      ))}
    </div>
  )
}
