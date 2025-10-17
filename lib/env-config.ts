/**
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
  }
}
