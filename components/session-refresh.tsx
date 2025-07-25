"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

export function SessionRefresh() {
  const { refreshSession } = useAuth()

  useEffect(() => {
    // Refresh session on mount
    refreshSession()

    // Set up periodic session refresh (every 30 minutes)
    const interval = setInterval(
      () => {
        refreshSession()
      },
      30 * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [refreshSession])

  return null
}
