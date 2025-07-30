"use client"

import { Loader2 } from "lucide-react"

interface SimpleLoadingProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
}

export function SimpleLoading({ className = "", size = "md", text }: SimpleLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  )
}
