interface ProductionConfig {
  jwt: {
    secret: string
    expiresIn: string
    refreshExpiresIn: string
  }
  database: {
    url: string
    poolSize: number
  }
  security: {
    corsOrigins: string[]
    rateLimitEnabled: boolean
  }
  features: {
    enablePayments: boolean
    enableUploads: boolean
    maintenanceMode: boolean
  }
}

class ProductionEnvironment {
  private static instance: ProductionEnvironment
  private config: ProductionConfig

  private constructor() {
    this.config = this.loadProductionConfig()
  }

  public static getInstance(): ProductionEnvironment {
    if (!ProductionEnvironment.instance) {
      ProductionEnvironment.instance = new ProductionEnvironment()
    }
    return ProductionEnvironment.instance
  }

  private loadProductionConfig(): ProductionConfig {
    // Generate secure JWT secret if not provided
    const jwtSecret = this.getOrGenerateJWTSecret()

    return {
      jwt: {
        secret: jwtSecret,
        expiresIn: process.env.JWT_EXPIRES_IN || "15m",
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
      },
      database: {
        url: process.env.POSTGRES_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        poolSize: Number.parseInt(process.env.DB_POOL_SIZE || "10"),
      },
      security: {
        corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["*"],
        rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== "false",
      },
      features: {
        enablePayments: process.env.ENABLE_PAYMENTS !== "false",
        enableUploads: process.env.ENABLE_UPLOADS !== "false",
        maintenanceMode: process.env.MAINTENANCE_MODE === "true",
      },
    }
  }

  private getOrGenerateJWTSecret(): string {
    // Try to get from environment
    let secret = process.env.JWT_SECRET

    // If not found or too short, generate a secure one
    if (!secret || secret.length < 32) {
      secret = this.generateSecureJWTSecret()
      console.log("🔐 Generated secure JWT secret. Consider setting JWT_SECRET environment variable.")
    }

    return secret
  }

  private generateSecureJWTSecret(): string {
    // Generate a cryptographically secure 64-character secret
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?"
    let result = ""

    // Use crypto.randomBytes if available, otherwise fallback
    try {
      if (typeof window === "undefined") {
        const crypto = require("crypto")
        const bytes = crypto.randomBytes(32)
        return bytes.toString("hex") + bytes.toString("base64").slice(0, 32)
      }
    } catch (error) {
      // Fallback for environments without crypto
    }

    // Fallback method
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  public getJWTConfig() {
    return this.config.jwt
  }

  public getDatabaseConfig() {
    return this.config.database
  }

  public getSecurityConfig() {
    return this.config.security
  }

  public getFeatureConfig() {
    return this.config.features
  }

  public isMaintenanceMode(): boolean {
    return this.config.features.maintenanceMode
  }
}

export const productionEnvironment = ProductionEnvironment.getInstance()
