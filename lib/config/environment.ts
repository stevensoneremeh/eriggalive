interface EnvironmentConfig {
  app: {
    name: string
    url: string
    environment: "development" | "staging" | "production"
    version: string
  }
  database: {
    url: string
    poolSize: number
    ssl: boolean
    connectionTimeout: number
    queryTimeout: number
  }
  auth: {
    jwtSecret: string
    jwtExpiresIn: string
    refreshTokenExpiresIn: string
    maxConcurrentSessions: number
    sessionDuration: number
    rememberMeDuration: number
  }
  security: {
    corsOrigins: string[]
    rateLimitEnabled: boolean
    encryptionKey: string
    hashRounds: number
  }
  upload: {
    maxFileSize: number
    allowedFileTypes: string[]
    storageProvider: "supabase" | "aws" | "cloudinary"
  }
  payment: {
    paystack: {
      publicKey: string
      secretKey: string
      webhookSecret: string
    }
  }
  monitoring: {
    enableMetrics: boolean
    logLevel: "error" | "warn" | "info" | "debug"
    auditLogLevel: "minimal" | "standard" | "detailed"
  }
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
  private isPreviewMode: boolean

  private constructor() {
    this.isPreviewMode = this.detectPreviewMode()
    this.config = this.loadConfiguration()
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment()
    }
    return Environment.instance
  }

  private detectPreviewMode(): boolean {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      return (
        hostname.includes("v0.dev") ||
        hostname.includes("vusercontent.net") ||
        hostname.includes("localhost") ||
        hostname === "127.0.0.1"
      )
    }

    return (
      process.env.VERCEL_ENV === "preview" ||
      process.env.NODE_ENV === "development" ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.JWT_SECRET
    )
  }

  private loadConfiguration(): EnvironmentConfig {
    const nodeEnv = process.env.NODE_ENV || "development"

    // Provide safe defaults for preview mode
    const defaults = {
      app: {
        name: "Erigga Fan Platform",
        url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        environment: nodeEnv as "development" | "staging" | "production",
        version: process.env.npm_package_version || "1.0.0",
      },
      database: {
        url: process.env.POSTGRES_URL || "mock://localhost",
        poolSize: Number.parseInt(process.env.DB_POOL_SIZE || "10"),
        ssl: !this.isPreviewMode,
        connectionTimeout: Number.parseInt(process.env.DB_CONNECTION_TIMEOUT || "30000"),
        queryTimeout: Number.parseInt(process.env.DB_QUERY_TIMEOUT || "60000"),
      },
      auth: {
        jwtSecret: process.env.JWT_SECRET || "preview-mode-secret-key-not-for-production",
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
        refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
        maxConcurrentSessions: Number.parseInt(process.env.MAX_CONCURRENT_SESSIONS || "3"),
        sessionDuration: Number.parseInt(process.env.SESSION_DURATION || "86400000"),
        rememberMeDuration: Number.parseInt(process.env.REMEMBER_ME_DURATION || "2592000000"),
      },
      security: {
        corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
        rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === "true" && !this.isPreviewMode,
        encryptionKey: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "preview-encryption-key",
        hashRounds: Number.parseInt(process.env.HASH_ROUNDS || "12"),
      },
      upload: {
        maxFileSize: Number.parseInt(process.env.FILE_UPLOAD_MAX_SIZE || "52428800"),
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
        enableMetrics: process.env.ENABLE_METRICS === "true" && !this.isPreviewMode,
        logLevel: (process.env.LOG_LEVEL as "error" | "warn" | "info" | "debug") || "info",
        auditLogLevel: (process.env.AUDIT_LOG_LEVEL as "minimal" | "standard" | "detailed") || "standard",
      },
      features: {
        enableRegistration: process.env.ENABLE_REGISTRATION !== "false",
        enablePayments: process.env.ENABLE_PAYMENTS !== "false" && !this.isPreviewMode,
        enableUploads: process.env.ENABLE_UPLOADS !== "false",
        enableNotifications: process.env.ENABLE_NOTIFICATIONS !== "false" && !this.isPreviewMode,
        maintenanceMode: process.env.MAINTENANCE_MODE === "true",
      },
    }

    if (this.isPreviewMode) {
      console.log("🔧 Environment running in preview mode with safe defaults")
    }

    return defaults
  }

  public get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key]
  }

  public getAll(): EnvironmentConfig {
    return { ...this.config }
  }

  public isProduction(): boolean {
    return this.config.app.environment === "production" && !this.isPreviewMode
  }

  public isDevelopment(): boolean {
    return this.config.app.environment === "development" || this.isPreviewMode
  }

  public isFeatureEnabled(feature: keyof EnvironmentConfig["features"]): boolean {
    return this.config.features[feature]
  }

  public validatePaymentConfig(): boolean {
    if (this.isPreviewMode) return false
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
      windowMs: 15 * 60 * 1000,
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
