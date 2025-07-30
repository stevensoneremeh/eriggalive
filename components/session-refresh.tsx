"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

export function SessionRefresh() {
  const { refreshProfile, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return

    // Refresh profile data every 30 seconds to keep it up to date
    const interval = setInterval(() => {
      refreshProfile()
    }, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated, refreshProfile])

  return null
}
