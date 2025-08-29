import { createClient } from "@/lib/supabase/client"
import type { FeatureFlag, UserContext } from "./types"

class FeatureFlagClient {
  private flags: Map<string, FeatureFlag> = new Map()
  private userContext: UserContext = {}
  private supabase = createClient()

  async initialize(userContext?: UserContext) {
    this.userContext = userContext || {}
    await this.loadFlags()
  }

  private async loadFlags() {
    try {
      const { data: flags, error } = await this.supabase
        .from("feature_flags")
        .select("*")
        .eq("enabled", true)
        .or(`environment.eq.all,environment.eq.${process.env.NODE_ENV || "development"}`)

      if (error) {
        console.error("Error loading feature flags:", error)
        return
      }

      this.flags.clear()
      flags?.forEach((flag) => {
        this.flags.set(flag.id, flag)
      })
    } catch (error) {
      console.error("Failed to load feature flags:", error)
    }
  }

  isEnabled(flagKey: string): boolean {
    const flag = this.flags.get(flagKey)
    if (!flag) return false

    // Check if flag is expired
    if (flag.expires_at && new Date(flag.expires_at) < new Date()) {
      return false
    }

    // Check user segments
    if (flag.user_segments && flag.user_segments.length > 0) {
      const userSegment = this.userContext.segment || "default"
      if (!flag.user_segments.includes(userSegment)) {
        return false
      }
    }

    // Check rollout percentage
    if (flag.rollout_percentage < 100) {
      const userId = this.userContext.userId || "anonymous"
      const hash = this.hashString(userId + flagKey)
      const percentage = hash % 100
      return percentage < flag.rollout_percentage
    }

    return flag.enabled
  }

  getFlag(flagKey: string): FeatureFlag | null {
    return this.flags.get(flagKey) || null
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values())
  }

  async refresh() {
    await this.loadFlags()
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

export const featureFlagClient = new FeatureFlagClient()
