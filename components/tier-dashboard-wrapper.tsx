"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"

interface TierDashboardWrapperProps {
  children: React.ReactNode
}

export function TierDashboardWrapper({ children }: TierDashboardWrapperProps) {
  const { profile } = useAuth()
  const { theme } = useTheme()

  if (!profile) return <>{children}</>

  const tierClass = `tier-${profile.tier}`
  const themeClass = theme === "dark" ? "dark" : "light"

  return (
    <div className={`${tierClass} ${themeClass} min-h-screen transition-all duration-500`}>
      <style jsx>{`
        .tier-${profile.tier} {
          --current-tier-primary: var(--${profile.tier}-primary);
          --current-tier-secondary: var(--${profile.tier}-secondary);
        }
        
        .tier-${profile.tier} .tier-accent {
          color: hsl(var(--current-tier-primary));
        }
        
        .tier-${profile.tier} .tier-bg {
          background-color: hsl(var(--current-tier-secondary));
        }
        
        .tier-${profile.tier} .tier-border {
          border-color: hsl(var(--current-tier-primary));
        }
        
        .tier-${profile.tier} .tier-button {
          background-color: hsl(var(--current-tier-primary));
          color: white;
        }
        
        .tier-${profile.tier} .tier-button:hover {
          background-color: hsl(var(--current-tier-primary) / 0.9);
        }
        
        .tier-${profile.tier} .tier-glow {
          box-shadow: 0 0 20px hsl(var(--current-tier-primary) / 0.3);
        }
      `}</style>
      {children}
    </div>
  )
}
