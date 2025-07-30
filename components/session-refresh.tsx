"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { clientAuth } from "@/lib/auth-utils"

export function SessionRefresh() {
  const { isAuthenticated, refreshSession } = useAuth()
  const pathname = usePathname()

  // Refresh session on route changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshSession()
    }
  }, [pathname, isAuthenticated, refreshSession])

  // Also refresh on initial load
  useEffect(() => {
    if (isAuthenticated) {
      refreshSession()
    }
  }, [isAuthenticated, refreshSession])

  // Set up periodic refresh
  useEffect(() => {
    if (!isAuthenticated) return

    // Immediate refresh
    refreshSession()

    // Set up interval for periodic refresh
    const interval = setInterval(
      () => {
        refreshSession()

        // Also check if we're still authenticated via our utility
        const stillAuthenticated = clientAuth.isAuthenticated()
        if (!stillAuthenticated) {
          // Force page reload if authentication is lost
          window.location.href = "/login"
        }
      },
      5 * 60 * 1000,
    ) // Every 5 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated, refreshSession])

  return null // This component doesn't render anything
}
