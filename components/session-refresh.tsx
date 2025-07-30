"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"

export function SessionRefresh() {
  const { refreshProfile } = useAuth()
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Refresh session every 30 minutes
    const interval = setInterval(
      async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession()
          if (error) {
            console.error("Error refreshing session:", error)
          } else if (data.session) {
            await refreshProfile()
          }
        } catch (error) {
          console.error("Error in session refresh:", error)
        }
      },
      30 * 60 * 1000,
    ) // 30 minutes

    return () => clearInterval(interval)
  }, [mounted, refreshProfile, supabase.auth])

  return null
}
