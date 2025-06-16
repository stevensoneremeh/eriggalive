interface EnvironmentConfig {
  // Database
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceRoleKey: string

  // Authentication
  jwtSecret: string
  jwtExpiresIn: string
  refreshTokenExpiresIn: string

  // Payment
  paystackPublicKey: string
  paystackSecretKey: string

  // Security
  corsOrigins: string[]
  rateLimitEnabled: boolean
  auditLogLevel: "low" | "medium" | "high" | "critical"

  // Features
  fileUploadMaxSize: number
  allowedFileTypes: string[]

  // Monitoring
  enableMetrics: boolean
  logLevel: "debug" | "info" | "warn" | "error"
}

class EnvironmentValidator {
  private requiredVars = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
    "PAYSTACK_PUBLIC_KEY",
    "PAYSTACK_SECRET_KEY",
    "NEXT_PUBLIC_APP_URL",
  ]

  validate(): EnvironmentConfig {
    const missing: string[] = []

    this.requiredVars.forEach((varName) => {
      if (!process.env[varName]) {
        missing.push(varName)
      }
    })

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
    }

    // Validate JWT secret strength
    const jwtSecret = process.env.JWT_SECRET!
    if (jwtSecret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long")
    }

    // Validate URLs
    try {
      new URL(process.env.SUPABASE_URL!)
      new URL(process.env.NEXT_PUBLIC_APP_URL!)
    } catch (error) {
      throw new Error("Invalid URL format in environment variables")
    }

    return {
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      jwtSecret: process.env.JWT_SECRET!,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
      refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
      paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      paystackSecretKey: process.env.PAYSTACK_SECRET_KEY!,
      corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
      rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== "false",
      auditLogLevel: (process.env.AUDIT_LOG_LEVEL as any) || "medium",
      fileUploadMaxSize: Number.parseInt(process.env.FILE_UPLOAD_MAX_SIZE || "52428800"), // 50MB
      allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(",") || [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "video/mp4",
        "video/webm",
        "video/ogg",
      ],
      enableMetrics: process.env.ENABLE_METRICS === "true",
      logLevel: (process.env.LOG_LEVEL as any) || "info",
    }
  }

  // Check if running in production
  isProduction(): boolean {
    return process.env.NODE_ENV === "production"
  }

  // Check if running in development
  isDevelopment(): boolean {
    return process.env.NODE_ENV === "development"
  }

  // Get environment-specific configuration
  getConfig(): EnvironmentConfig & { environment: string } {
    const config = this.validate()

    return {
      ...config,
      environment: process.env.NODE_ENV || "development",
    }
  }
}

export const environmentValidator = new EnvironmentValidator()
export const config = environmentValidator.getConfig()

// Runtime configuration checks
export async function performRuntimeChecks() {
  const checks = [
    {
      name: "Database Connection",
      check: async () => {
        try {
          const { createClient } = await import("@supabase/supabase-js")
          const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)
          const { error } = await supabase.from("users").select("count").limit(1)
          return !error
        } catch (error) {
          console.error("Database connection check failed:", error)
          return false
        }
      },
    },
    {
      name: "JWT Secret Strength",
      check: async () => config.jwtSecret.length >= 32,
    },
    {
      name: "CORS Configuration",
      check: async () => config.corsOrigins.length > 0,
    },
    {
      name: "File Upload Limits",
      check: async () => config.fileUploadMaxSize > 0 && config.allowedFileTypes.length > 0,
    },
  ]

  const results = []

  for (const check of checks) {
    try {
      const result = await check.check()
      results.push({
        name: check.name,
        status: result ? "PASS" : "FAIL",
        success: result,
      })
    } catch (error) {
      results.push({
        name: check.name,
        status: "ERROR",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return results
}

// Security configuration
export const securityConfig = {
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },

  // CORS settings
  cors: {
    origin: config.corsOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  },

  // Security headers
  headers: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' https:;",
  },

  // Session configuration
  session: {
    secret: config.jwtSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.environment === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "strict" as const,
    },
  },
}

// Feature flags
export const featureFlags = {
  enableRateLimit: config.rateLimitEnabled,
  enableMetrics: config.enableMetrics,
  enableAuditLog: true,
  enableFileUpload: true,
  enableRealtime: true,
  enableNotifications: true,
}

// Database configuration
export const databaseConfig = {
  url: config.supabaseUrl,
  anonKey: config.supabaseAnonKey,
  serviceRoleKey: config.supabaseServiceRoleKey,
  options: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  },
}

// Payment configuration
export const paymentConfig = {
  paystack: {
    publicKey: config.paystackPublicKey,
    secretKey: config.paystackSecretKey,
    currency: "NGN",
    channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
  },
}

// Logging configuration
export const loggingConfig = {
  level: config.logLevel,
  format: config.environment === "production" ? "json" : "simple",
  auditLevel: config.auditLogLevel,
  enableConsole: config.environment !== "production",
  enableFile: config.environment === "production",
}

// Export all configurations
export default {
  config,
  securityConfig,
  featureFlags,
  databaseConfig,
  paymentConfig,
  loggingConfig,
  performRuntimeChecks,
}
