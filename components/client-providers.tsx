"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { SessionContextProvider } from "@supabase/auth-helpers-react"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { SessionRefresh } from "@/components/session-refresh"
import { UnifiedNavigation } from "@/components/navigation/unified-navigation"
import { AuthGuard } from "@/components/auth-guard"

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  const supabase = createClient()

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <SessionRefresh />
      <ThemeProvider>
        <AuthProvider>
          <UnifiedNavigation />
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
      </ThemeProvider>
    </SessionContextProvider>
  )
}
