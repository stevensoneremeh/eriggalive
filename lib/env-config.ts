/**
<<<<<<< HEAD
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
=======
 * Environment Configuration
 * Safe environment detection for both client and server
 */

// Check if we're on the client side
export const isClient = typeof window !== "undefined"

// Check if we're on the server side
export const isServer = !isClient

/**
 * Get the current environment
 * Safe for both client and server
 */
export function getEnvironment(): "development" | "production" | "test" {
  if (isServer) {
    return (process.env.NODE_ENV as any) || "development"
  }
  // On client, check the hostname
  if (isClient) {
    const hostname = window.location.hostname
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "development"
    }
    return "production"
  }
  return "production"
}

/**
 * Check if we're in production (client-safe)
 */
export function isProduction(): boolean {
  return getEnvironment() === "production"
}

/**
 * Check if we're in development (client-safe)
 */
export function isDevelopment(): boolean {
  return getEnvironment() === "development"
}

/**
 * Get environment name for display (client-safe)
 */
export function getEnvName(): string {
  const env = getEnvironment()
  return env.charAt(0).toUpperCase() + env.slice(1)
}

/**
 * Public environment variables (safe to use on client)
 */
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  ablyKey: process.env.NEXT_PUBLIC_ABLY_KEY,
  zegocloudAppId: process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID,
  meetGreetPrice: process.env.NEXT_PUBLIC_MEETGREET_PRICE,
  meetGreetCurrency: process.env.NEXT_PUBLIC_MEETGREET_CURRENCY,
}

/**
 * Server-only environment variables
 * DO NOT use these on the client!
 */
export const serverEnv = isServer
  ? {
      adminPassword: process.env.ADMIN_PASSWORD,
      modPassword: process.env.MOD_PASSWORD,
      grassrootPassword: process.env.GRASSROOT_PASSWORD,
      pioneerPassword: process.env.PIONEER_PASSWORD,
      elderPassword: process.env.ELDER_PASSWORD,
      bloodPassword: process.env.BLOOD_PASSWORD,
      paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
      blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN,
      postgresUrl: process.env.POSTGRES_URL,
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
      zegocloudServerSecret: process.env.ZEGOCLOUD_SERVER_SECRET,
    }
  : {}

/**
 * Validate that required environment variables are present
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

  const missing = required.filter((key) => !process.env[key])

  return {
    valid: missing.length === 0,
    missing,
>>>>>>> new
  }
}
