"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { featureFlagClient } from "@/lib/feature-flags/client"
import { useAuth } from "./auth-context"
import type { FeatureFlagContext, FeatureFlag } from "@/lib/feature-flags/types"

const FeatureFlagsContext = createContext<FeatureFlagContext | null>(null)

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeFlags()
  }, [user, profile])

  const initializeFlags = async () => {
    setIsLoading(true)
    try {
      const userContext = {
        userId: user?.id,
        email: user?.email,
        tier: profile?.tier,
        segment: profile?.tier || "free",
        isAdmin: profile?.role === "admin",
      }

      await featureFlagClient.initialize(userContext)

      // Get all flags and their current state
      const allFlags = featureFlagClient.getAllFlags()
      const flagStates: Record<string, boolean> = {}

      allFlags.forEach((flag) => {
        flagStates[flag.id] = featureFlagClient.isEnabled(flag.id)
      })

      setFlags(flagStates)
    } catch (error) {
      console.error("Failed to initialize feature flags:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refresh = async () => {
    await featureFlagClient.refresh()
    await initializeFlags()
  }

  const isEnabled = (flagKey: string): boolean => {
    return flags[flagKey] || false
  }

  const getFlag = (flagKey: string): FeatureFlag | null => {
    return featureFlagClient.getFlag(flagKey)
  }

  const value: FeatureFlagContext = {
    flags,
    isLoading,
    refresh,
    isEnabled,
    getFlag,
  }

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext)
  if (!context) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider")
  }
  return context
}

// Convenience hook for checking a single flag
export function useFeatureFlag(flagKey: string): boolean {
  const { isEnabled } = useFeatureFlags()
  return isEnabled(flagKey)
}
