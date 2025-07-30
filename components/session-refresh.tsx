"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function SessionRefresh() {
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const refreshSession = async () => {
      try {
        await supabase.auth.refreshSession()
      } catch (error) {
        console.error("Error refreshing session:", error)
      }
    }

    // Refresh session on mount
    refreshSession()

    // Set up interval to refresh session periodically
    const interval = setInterval(refreshSession, 30 * 60 * 1000) // 30 minutes

    return () => {
      clearInterval(interval)
    }
  }, [mounted, supabase.auth])

  // Don't render anything
  return null
}
