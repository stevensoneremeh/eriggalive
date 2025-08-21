"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"

export function ModernThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-32 h-10 bg-muted animate-pulse rounded-lg" />
  }

  return (
    <div className="flex items-center bg-muted/50 rounded-lg p-1 backdrop-blur-sm border">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("light")}
        className={cn(
          "h-8 px-3 transition-all duration-200 rounded-md",
          theme === "light" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Light mode</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("dark")}
        className={cn(
          "h-8 px-3 transition-all duration-200 rounded-md",
          theme === "dark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Moon className="h-4 w-4" />
        <span className="sr-only">Dark mode</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("system")}
        className={cn(
          "h-8 px-3 transition-all duration-200 rounded-md",
          theme === "system"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Monitor className="h-4 w-4" />
        <span className="sr-only">System mode</span>
      </Button>
    </div>
  )
}
