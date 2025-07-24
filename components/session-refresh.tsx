"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"

export function SessionRefresh() {
  const { isAuthenticated, refreshProfile } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!isAuthenticated) return

    // Set up an interval to refresh the session every 10 minutes
    const interval = setInterval(
      async () => {
        try {
          // Refresh the session
          const { error } = await supabase.auth.refreshSession()
          if (error) {
            console.error("Error refreshing session:", error)
          } else {
            // If session refresh was successful, also refresh the user profile
            await refreshProfile()
          }
        } catch (err) {
          console.error("Error in session refresh:", err)
        }
      },
      10 * 60 * 1000,
    ) // 10 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated, refreshProfile, supabase])

  // This component doesn't render anything
  return null
}

export default SessionRefresh
