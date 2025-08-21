"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  variant?: "default" | "compact" | "mobile"
  className?: string
}

export function ThemeToggle({ variant = "default", className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        <div className="w-8 h-8 bg-muted animate-pulse rounded-md" />
        <div className="w-8 h-8 bg-muted animate-pulse rounded-md" />
        <div className="w-8 h-8 bg-muted animate-pulse rounded-md" />
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className={cn("h-9 w-9 transition-all duration-200", className)}
        title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      >
        {resolvedTheme === "dark" ? (
          <Sun className="h-4 w-4 text-amber-500" />
        ) : (
          <Moon className="h-4 w-4 text-slate-600" />
        )}
      </Button>
    )
  }

  if (variant === "mobile") {
    return (
      <div className={cn("space-y-2", className)}>
        <p className="text-sm font-medium text-foreground">Theme</p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("light")}
            className="flex flex-col items-center py-3 h-auto"
          >
            <Sun className="h-4 w-4 mb-1" />
            <span className="text-xs">Light</span>
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("dark")}
            className="flex flex-col items-center py-3 h-auto"
          >
            <Moon className="h-4 w-4 mb-1" />
            <span className="text-xs">Dark</span>
          </Button>
          <Button
            variant={theme === "system" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("system")}
            className="flex flex-col items-center py-3 h-auto"
          >
            <Monitor className="h-4 w-4 mb-1" />
            <span className="text-xs">Auto</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center space-x-1 p-1 bg-muted/50 rounded-lg", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("light")}
        className={cn(
          "h-8 w-8 p-0 transition-all duration-200",
          theme === "light" && "bg-background shadow-sm text-foreground",
        )}
        title="Light mode"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("dark")}
        className={cn(
          "h-8 w-8 p-0 transition-all duration-200",
          theme === "dark" && "bg-background shadow-sm text-foreground",
        )}
        title="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("system")}
        className={cn(
          "h-8 w-8 p-0 transition-all duration-200",
          theme === "system" && "bg-background shadow-sm text-foreground",
        )}
        title="System mode"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  )
}
