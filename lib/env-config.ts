/**
 * Environment Configuration
 * This file provides safe access to environment variables on both client and server
 *
 * IMPORTANT:
 * - Server-only variables should NOT be prefixed with NEXT_PUBLIC_
 * - Client-accessible variables MUST be prefixed with NEXT_PUBLIC_
 */

// Server-side environment check (only accessible on server)
export const isProduction = typeof window === "undefined" ? process.env.NODE_ENV === "production" : false

export const isDevelopment = typeof window === "undefined" ? process.env.NODE_ENV === "development" : false

// Client-safe environment detection
// Use this on the client side instead of process.env.NODE_ENV
export const getEnvironment = () => {
  if (typeof window === "undefined") {
    // Server side
    return process.env.NODE_ENV || "development"
  }

  // Client side - detect based on URL or other client-accessible indicators
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "development"
    }
    if (hostname.includes("vercel.app") || hostname.includes("preview")) {
      return "preview"
    }
    return "production"
  }

  return "development"
}

// Client-safe production check
export const isClientProduction = () => {
  if (typeof window === "undefined") return false
  const hostname = window.location.hostname
  return !hostname.includes("localhost") && !hostname.includes("127.0.0.1") && !hostname.includes("preview")
}

// Environment variables that are safe to use on client (prefixed with NEXT_PUBLIC_)
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
  ablyKey: process.env.NEXT_PUBLIC_ABLY_KEY || "",
  zegocloudAppId: process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID || "",
  meetGreetPrice: process.env.NEXT_PUBLIC_MEETGREET_PRICE || "",
  meetGreetCurrency: process.env.NEXT_PUBLIC_MEETGREET_CURRENCY || "NGN",
}

// Server-only environment variables (NO NEXT_PUBLIC_ prefix)
// These should NEVER be accessed on the client
export const serverEnv = {
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  modPassword: process.env.MOD_PASSWORD || "",
  grassrootPassword: process.env.GRASSROOT_PASSWORD || "",
  pioneerPassword: process.env.PIONEER_PASSWORD || "",
  elderPassword: process.env.ELDER_PASSWORD || "",
  bloodPassword: process.env.BLOOD_PASSWORD || "",
  zegocloudServerSecret: process.env.ZEGOCLOUD_SERVER_SECRET || "",
}

// Helper to safely get environment name on client
export const getEnvName = (): "development" | "preview" | "production" => {
  const env = getEnvironment()
  if (env === "production") return "production"
  if (env === "preview") return "preview"
  return "development"
}
