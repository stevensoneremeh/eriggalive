export interface FeatureFlag {
  id: string
  name: string
  description: string
  enabled: boolean
  rollout_percentage: number
  user_segments?: string[]
  environment: "development" | "staging" | "production" | "all"
  created_at: string
  updated_at: string
  expires_at?: string
}

export interface FeatureFlagContext {
  flags: Record<string, boolean>
  isLoading: boolean
  refresh: () => Promise<void>
  isEnabled: (flagKey: string) => boolean
  getFlag: (flagKey: string) => FeatureFlag | null
}

export interface UserContext {
  userId?: string
  email?: string
  tier?: string
  segment?: string
  isAdmin?: boolean
}
