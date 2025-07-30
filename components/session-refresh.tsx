"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"

export function SessionRefresh() {
  const { refreshSession } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Refresh session every 30 minutes
    const interval = setInterval(
      () => {
        refreshSession()
      },
      30 * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [refreshSession, mounted])

  // This component doesn't render anything
  return null
}
