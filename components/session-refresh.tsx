"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

export function SessionRefresh() {
  const { user, refreshSession } = useAuth()

  useEffect(() => {
    // Only run if user is logged in
    if (!user) return

    // Refresh the session immediately
    refreshSession()

    // Set up an interval to refresh the session every 15 minutes
    const interval = setInterval(
      () => {
        refreshSession()
      },
      15 * 60 * 1000,
    ) // 15 minutes

    return () => clearInterval(interval)
  }, [user, refreshSession])

  // This component doesn't render anything
  return null
}
