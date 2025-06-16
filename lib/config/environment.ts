interface EnvironmentConfig {
  // App configuration
  app: {
    name: string
    url: string
    environment: "development" | "staging" | "production"
    version: string
  }

  // Database configuration
  database: {
    url: string
    poolSize: number
    ssl: boolean
    connectionTimeout: number
    queryTimeout: number
  }

  // Authentication configuration
  auth: {
    jwtSecret: string
    jwtExpiresIn: string
    refreshTokenExpiresIn: string
    maxConcurrentSessions: number
    sessionDuration: number
    rememberMeDuration: number
  }

  // Security configuration
  security: {
    corsOrigins: string[]
    rateLimitEnabled: boolean
    encryptionKey: string
    hashRounds: number
  }

  // File upload configuration
  upload: {
    maxFileSize: number
    allowedFileTypes: string[]
    storageProvider: "supabase" | "aws" | "cloudinary"
  }

  // Payment configuration
  payment: {
    paystack: {
      publicKey: string
      secretKey: string
      webhookSecret: string
    }
  }

  // Monitoring configuration
  monitoring: {
    enableMetrics: boolean
    logLevel: "error" | "warn" | "info" | "debug"
    auditLogLevel: "minimal" | "standard" | "detailed"
  }

  // Feature flags
  features: {
    enableRegistration: boolean
    enablePayments: boolean
    enableUploads: boolean
    enableNotifications: boolean
    maintenanceMode: boolean
  }
}

class Environment {
  private static instance: Environment
  private config: EnvironmentConfig

  private constructor() {
    this.validateEnvironment()
    this.config = this.loadConfiguration()
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment()
    }
    return Environment.instance
  }

  private validateEnvironment(): void {
    const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET", "NEXT_PUBLIC_APP_URL"]

    const missing = requiredVars.filter((varName) => !process.env[varName])

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
    }

    // Validate JWT secret strength
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long for production")
    }

    // Validate URLs
    try {
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
      new URL(process.env.NEXT_PUBLIC_APP_URL!)
    } catch {
      throw new Error("Invalid URL format in environment variables")
    }
  }

  private loadConfiguration(): EnvironmentConfig {
    const nodeEnv = process.env.NODE_ENV || "development"
    const isProduction = nodeEnv === "production"

    return {
      app: {
        name: "Erigga Fan Platform",
        url: process.env.NEXT_PUBLIC_APP_URL!,
        environment: nodeEnv as "development" | "staging" | "production",
        version: process.env.npm_package_version || "1.0.0",
      },

      database: {
        url: process.env.POSTGRES_URL!,
        poolSize: Number.parseInt(process.env.DB_POOL_SIZE || "10"),
        ssl: isProduction,
        connectionTimeout: Number.parseInt(process.env.DB_CONNECTION_TIMEOUT || "30000"),
        queryTimeout: Number.parseInt(process.env.DB_QUERY_TIMEOUT || "60000"),
      },

      auth: {
        jwtSecret: process.env.JWT_SECRET!,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
        refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
        maxConcurrentSessions: Number.parseInt(process.env.MAX_CONCURRENT_SESSIONS || "3"),
        sessionDuration: Number.parseInt(process.env.SESSION_DURATION || "86400000"), // 24 hours
        rememberMeDuration: Number.parseInt(process.env.REMEMBER_ME_DURATION || "2592000000"), // 30 days
      },

      security: {
        corsOrigins: process.env.CORS_ORIGINS?.split(",") || [process.env.NEXT_PUBLIC_APP_URL!],
        rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === "true",
        encryptionKey: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET!,
        hashRounds: Number.parseInt(process.env.HASH_ROUNDS || "12"),
      },

      upload: {
        maxFileSize: Number.parseInt(process.env.FILE_UPLOAD_MAX_SIZE || "52428800"), // 50MB
        allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(",") || [
          "image/jpeg",
          "image/png",
          "image/webp",
          "video/mp4",
          "audio/mpeg",
          "audio/wav",
        ],
        storageProvider: (process.env.STORAGE_PROVIDER as "supabase" | "aws" | "cloudinary") || "supabase",
      },

      payment: {
        paystack: {
          publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
          secretKey: process.env.PAYSTACK_SECRET_KEY || "",
          webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || "",
        },
      },

      monitoring: {
        enableMetrics: process.env.ENABLE_METRICS === "true",
        logLevel: (process.env.LOG_LEVEL as "error" | "warn" | "info" | "debug") || "info",
        auditLogLevel: (process.env.AUDIT_LOG_LEVEL as "minimal" | "standard" | "detailed") || "standard",
      },

      features: {
        enableRegistration: process.env.ENABLE_REGISTRATION !== "false",
        enablePayments: process.env.ENABLE_PAYMENTS !== "false",
        enableUploads: process.env.ENABLE_UPLOADS !== "false",
        enableNotifications: process.env.ENABLE_NOTIFICATIONS !== "false",
        maintenanceMode: process.env.MAINTENANCE_MODE === "true",
      },
    }
  }

  public get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key]
  }

  public getAll(): EnvironmentConfig {
    return { ...this.config }
  }

  public isProduction(): boolean {
    return this.config.app.environment === "production"
  }

  public isDevelopment(): boolean {
    return this.config.app.environment === "development"
  }

  public isFeatureEnabled(feature: keyof EnvironmentConfig["features"]): boolean {
    return this.config.features[feature]
  }

  public validatePaymentConfig(): boolean {
    const { paystack } = this.config.payment
    return !!(paystack.publicKey && paystack.secretKey)
  }

  public getConnectionString(): string {
    return this.config.database.url
  }

  public getCorsOrigins(): string[] {
    return this.config.security.corsOrigins
  }

  public getJWTConfig() {
    return {
      secret: this.config.auth.jwtSecret,
      expiresIn: this.config.auth.jwtExpiresIn,
      refreshExpiresIn: this.config.auth.refreshTokenExpiresIn,
    }
  }

  public getRateLimitConfig() {
    return {
      enabled: this.config.security.rateLimitEnabled,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    }
  }

  public getUploadConfig() {
    return {
      maxFileSize: this.config.upload.maxFileSize,
      allowedTypes: this.config.upload.allowedFileTypes,
      provider: this.config.upload.storageProvider,
    }
  }
}

export const environment = Environment.getInstance()
export type { EnvironmentConfig }
