/**
 * Environment configuration helper
 * Validates and provides environment variables with proper error handling
 */

export interface EnvConfig {
  supabaseUrl: string | undefined
  supabaseAnonKey: string | undefined
  supabaseServiceRoleKey: string | undefined
  isProduction: boolean
  isDevelopment: boolean
  isPreview: boolean
  hasSupabaseConfig: boolean
}

export function getEnvConfig(): EnvConfig {
  const isProduction = process.env.NODE_ENV === "production"
  const isDevelopment = process.env.NODE_ENV === "development"
  const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey)

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    isProduction,
    isDevelopment,
    isPreview,
    hasSupabaseConfig,
  }
}

export function validateEnvironment(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const config = getEnvConfig()
  const errors: string[] = []
  const warnings: string[] = []

  // Check required environment variables
  if (!config.supabaseUrl) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is required")
  }

  if (!config.supabaseAnonKey) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
  }

  // Check optional but recommended variables
  if (!config.supabaseServiceRoleKey && config.isProduction) {
    warnings.push("SUPABASE_SERVICE_ROLE_KEY is recommended for production")
  }

  // Validate URL format
  if (config.supabaseUrl && !config.supabaseUrl.startsWith("https://")) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL")
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

export function logEnvironmentStatus(): void {
  const config = getEnvConfig()
  const validation = validateEnvironment()

  console.log("🔧 Environment Configuration:")
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`)
  console.log(`   Supabase URL: ${config.supabaseUrl ? "✅ Set" : "❌ Missing"}`)
  console.log(`   Supabase Anon Key: ${config.supabaseAnonKey ? "✅ Set" : "❌ Missing"}`)
  console.log(`   Supabase Service Role: ${config.supabaseServiceRoleKey ? "✅ Set" : "⚠️  Missing"}`)

  if (validation.errors.length > 0) {
    console.error("❌ Environment Errors:")
    validation.errors.forEach((error) => console.error(`   - ${error}`))
  }

  if (validation.warnings.length > 0) {
    console.warn("⚠️  Environment Warnings:")
    validation.warnings.forEach((warning) => console.warn(`   - ${warning}`))
  }

  if (validation.isValid) {
    console.log("✅ Environment configuration is valid")
  }
}
