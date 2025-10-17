/**
 * Environment variable checker utility
 * Provides fallbacks and warnings for missing environment variables
 */

export interface EnvConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceRoleKey?: string
  isProduction: boolean
  isDevelopment: boolean
  isPreview: boolean
}

export function getEnvConfig(): EnvConfig {
  const isProduction = process.env.NODE_ENV === "production"
  const isDevelopment = process.env.NODE_ENV === "development"
  const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Log warnings for missing environment variables
  if (!supabaseUrl && isProduction) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL is required in production")
  }

  if (!supabaseAnonKey && isProduction) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is required in production")
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️  Missing Supabase environment variables - using demo mode")
  }

  return {
    supabaseUrl: supabaseUrl || "https://demo.supabase.co",
    supabaseAnonKey: supabaseAnonKey || "demo-anon-key",
    supabaseServiceRoleKey,
    isProduction,
    isDevelopment,
    isPreview,
  }
}

export function checkRequiredEnvVars(): boolean {
  const config = getEnvConfig()

  if (config.isProduction) {
    const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

    const missing = required.filter((key) => !process.env[key])

    if (missing.length > 0) {
      console.error("❌ Missing required environment variables:", missing)
      return false
    }
  }

  return true
}

export function getSupabaseConfig() {
  const config = getEnvConfig()

  return {
    url: config.supabaseUrl,
    anonKey: config.supabaseAnonKey,
    serviceRoleKey: config.supabaseServiceRoleKey,
    isDemo: !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}
