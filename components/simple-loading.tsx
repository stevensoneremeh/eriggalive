"use client"

import { Loader2 } from "lucide-react"

interface SimpleLoadingProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
}

export function SimpleLoading({ className = "", size = "md", text = "Loading..." }: SimpleLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} text-primary mb-2`} />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
