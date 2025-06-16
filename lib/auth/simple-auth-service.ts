import { createClient } from "@supabase/supabase-js"
import { productionEnvironment } from "@/lib/config/production-environment"
import type { Database } from "@/types/database"

interface AuthCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

interface AuthResult {
  success: boolean
  user?: any
  tokens?: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
  error?: string
}

class SimpleTokenManager {
  private secret: string

  constructor() {
    const jwtConfig = productionEnvironment.getJWTConfig()
    this.secret = jwtConfig.secret
  }

  createToken(payload: any, expiresIn: number): string {
    const header = { typ: "JWT", alg: "HS256" }
    const now = Math.floor(Date.now() / 1000)

    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + Math.floor(expiresIn / 1000),
      jti: this.generateId(),
    }

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
    const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload))
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`)

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  verifyToken(token: string): any {
    try {
      const parts = token.split(".")
      if (parts.length !== 3) throw new Error("Invalid token format")

      const [encodedHeader, encodedPayload, signature] = parts
      const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`)

      if (signature !== expectedSignature) throw new Error("Invalid signature")

      const payload = JSON.parse(this.base64UrlDecode(encodedPayload))

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error("Token expired")
      }

      return payload
    } catch (error) {
      throw new Error(`Token validation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private base64UrlEncode(str: string): string {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  }

  private base64UrlDecode(str: string): string {
    str += "=".repeat((4 - (str.length % 4)) % 4)
    return atob(str.replace(/-/g, "+").replace(/_/g, "/"))
  }

  private createSignature(data: string): string {
    // Simple hash for browser compatibility
    let hash = 0
    const combined = data + this.secret
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return btoa(hash.toString()).replace(/[^a-zA-Z0-9]/g, "")
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export class SimpleAuthService {
  private supabase: any
  private tokenManager: SimpleTokenManager

  constructor() {
    this.tokenManager = new SimpleTokenManager()
    this.initializeSupabase()
  }

  private initializeSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    } else {
      // Create mock client for development
      this.supabase = this.createMockClient()
      console.log("🔧 Using mock Supabase client")
    }
  }

  private createMockClient() {
    return {
      auth: {
        signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
          if (email && password) {
            return {
              data: {
                user: {
                  id: "mock-user-id",
                  email: email,
                  created_at: new Date().toISOString(),
                },
              },
              error: null,
            }
          }
          return {
            data: { user: null },
            error: { message: "Invalid login credentials" },
          }
        },
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  id: 1,
                  email: "demo@example.com",
                  username: "demouser",
                  full_name: "Demo User",
                  tier: "grassroot",
                  coins: 500,
                  is_active: true,
                  is_banned: false,
                },
                error: null,
              }),
          }),
        }),
      }),
    }
  }

  async login(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        return { success: false, error: "Email and password are required" }
      }

      // Authenticate with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (authError || !authData.user) {
        return { success: false, error: "Invalid email or password" }
      }

      // Get user profile
      const { data: userProfile, error: profileError } = await this.supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", authData.user.id)
        .single()

      if (profileError || !userProfile) {
        // Return mock profile for development
        const mockProfile = {
          id: 1,
          email: credentials.email,
          username: credentials.email.split("@")[0],
          full_name: "Demo User",
          tier: "grassroot",
          coins: 500,
          is_active: true,
          is_banned: false,
        }
        return this.createAuthResult(mockProfile, credentials.rememberMe)
      }

      if (!userProfile.is_active) {
        return { success: false, error: "Account is inactive" }
      }

      if (userProfile.is_banned) {
        return { success: false, error: "Account is banned" }
      }

      return this.createAuthResult(userProfile, credentials.rememberMe)
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Login failed" }
    }
  }

  private createAuthResult(userProfile: any, rememberMe?: boolean): AuthResult {
    const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days or 24 hours

    const accessToken = this.tokenManager.createToken(
      {
        sub: userProfile.id.toString(),
        email: userProfile.email,
        username: userProfile.username,
        tier: userProfile.tier,
        role: "user",
      },
      15 * 60 * 1000, // 15 minutes
    )

    const refreshToken = this.tokenManager.createToken(
      {
        sub: userProfile.id.toString(),
        type: "refresh",
      },
      sessionDuration,
    )

    return {
      success: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        username: userProfile.username,
        fullName: userProfile.full_name,
        tier: userProfile.tier,
        coins: userProfile.coins,
        isActive: userProfile.is_active,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: sessionDuration,
      },
    }
  }

  async validateToken(token: string): Promise<AuthResult> {
    try {
      const payload = this.tokenManager.verifyToken(token)

      return {
        success: true,
        user: {
          id: payload.sub,
          email: payload.email,
          username: payload.username,
          tier: payload.tier,
        },
      }
    } catch (error) {
      return { success: false, error: "Invalid token" }
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const payload = this.tokenManager.verifyToken(refreshToken)

      if (payload.type !== "refresh") {
        return { success: false, error: "Invalid refresh token" }
      }

      const newAccessToken = this.tokenManager.createToken(
        {
          sub: payload.sub,
          email: payload.email,
          username: payload.username,
          tier: payload.tier,
          role: "user",
        },
        15 * 60 * 1000, // 15 minutes
      )

      return {
        success: true,
        tokens: {
          accessToken: newAccessToken,
          refreshToken,
          expiresIn: 15 * 60 * 1000,
        },
      }
    } catch (error) {
      return { success: false, error: "Token refresh failed" }
    }
  }
}

export const simpleAuthService = new SimpleAuthService()
