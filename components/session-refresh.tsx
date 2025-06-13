"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"

export function SessionRefresh() {
  const { refreshSession, isAuthenticated } = useAuth()
  const pathname = usePathname()

  // Refresh session on route changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshSession()
    }
  }, [pathname, isAuthenticated, refreshSession])

  // Also refresh periodically
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(
      () => {
        refreshSession()
      },
      5 * 60 * 1000,
    ) // Every 5 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated, refreshSession])

  return null // This component doesn't render anything
}
