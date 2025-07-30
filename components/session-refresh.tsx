"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function SessionRefresh() {
  useEffect(() => {
    const supabase = createClient()

    // Set up session refresh
    const refreshSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) {
          console.error("Error refreshing session:", error)
        }
      } catch (error) {
        console.error("Error refreshing session:", error)
      }
    }

    // Refresh session every 30 minutes
    const interval = setInterval(refreshSession, 30 * 60 * 1000)

    // Initial refresh
    refreshSession()

    return () => clearInterval(interval)
  }, [])

  return null
}
