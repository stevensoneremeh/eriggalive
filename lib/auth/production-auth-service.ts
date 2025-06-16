import { supabaseAdmin } from "@/lib/supabase/production-client"
import { randomBytes } from "crypto"
import { sign, verify } from "jsonwebtoken"

interface ProductionAuthConfig {
  jwtSecret: string
  jwtExpiresIn: string
  refreshTokenExpiresIn: string
  maxConcurrentSessions: number
  sessionDuration: number
  rememberMeDuration: number
  rateLimitWindow: number
  maxLoginAttempts: number
}

interface AuthResult {
  success: boolean
  user?: any
  tokens?: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
  session?: any
  error?: string
}

export class ProductionAuthService {
  private config: ProductionAuthConfig

  constructor() {
    // Validate required environment variables
    const requiredVars = ["JWT_SECRET", "SUPABASE_SERVICE_ROLE_KEY"]
    const missing = requiredVars.filter((varName) => !process.env[varName])

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
    }

    this.config = {
      jwtSecret: process.env.JWT_SECRET!,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
      refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
      maxConcurrentSessions: Number.parseInt(process.env.MAX_CONCURRENT_SESSIONS || "3"),
      sessionDuration: Number.parseInt(process.env.SESSION_DURATION || "86400000"),
      rememberMeDuration: Number.parseInt(process.env.REMEMBER_ME_DURATION || "2592000000"),
      rateLimitWindow: 15 * 60 * 1000, // 15 minutes
      maxLoginAttempts: 5,
    }
  }

  async login(credentials: {
    email: string
    password: string
    rememberMe?: boolean
    ipAddress: string
    userAgent: string
  }): Promise<AuthResult> {
    try {
      // Rate limiting check
      await this.checkRateLimit(credentials.ipAddress, "login")

      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (authError || !authData.user) {
        await this.logFailedAttempt(credentials.email, credentials.ipAddress)
        return {
          success: false,
          error: "Invalid email or password",
        }
      }

      // Get user profile
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("auth_user_id", authData.user.id)
        .single()

      if (profileError || !userProfile) {
        return {
          success: false,
          error: "User profile not found",
        }
      }

      // Check account status
      if (!userProfile.is_active) {
        return {
          success: false,
          error: "Account is inactive",
        }
      }

      if (userProfile.is_banned) {
        return {
          success: false,
          error: "Account is banned",
        }
      }

      // Check if account is locked
      if (userProfile.locked_until && new Date(userProfile.locked_until) > new Date()) {
        return {
          success: false,
          error: "Account is temporarily locked",
        }
      }

      // Manage concurrent sessions
      await this.manageConcurrentSessions(userProfile.id)

      // Create session
      const session = await this.createSession({
        userId: userProfile.id,
        ipAddress: credentials.ipAddress,
        userAgent: credentials.userAgent,
        rememberMe: credentials.rememberMe || false,
      })

      // Generate tokens
      const accessToken = this.generateAccessToken(userProfile)
      const refreshToken = this.generateRefreshToken(session.sessionToken)

      // Update login statistics
      await this.updateLoginStats(userProfile.id, credentials.ipAddress)

      // Clear failed attempts
      await this.clearFailedAttempts(credentials.email)

      return {
        success: true,
        user: {
          id: userProfile.id,
          email: userProfile.email,
          username: userProfile.username,
          fullName: userProfile.full_name,
          tier: userProfile.tier,
          coins: userProfile.coins,
          level: userProfile.level,
          points: userProfile.points,
          avatarUrl: userProfile.avatar_url,
          isActive: userProfile.is_active,
          isVerified: userProfile.is_verified,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: credentials.rememberMe ? this.config.rememberMeDuration : this.config.sessionDuration,
        },
        session,
      }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      }
    }
  }

  async validateSession(sessionToken: string): Promise<AuthResult> {
    try {
      const { data: sessionData, error } = await supabaseAdmin
        .from("user_sessions")
        .select(`
          *,
          users (*)
        `)
        .eq("session_token", sessionToken)
        .eq("is_active", true)
        .single()

      if (error || !sessionData) {
        return { success: false, error: "Invalid session" }
      }

      // Check expiration
      if (new Date(sessionData.expires_at) < new Date()) {
        await this.deactivateSession(sessionToken)
        return { success: false, error: "Session expired" }
      }

      // Update last activity
      await this.updateSessionActivity(sessionToken)

      const user = sessionData.users as any

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.full_name,
          tier: user.tier,
          coins: user.coins,
          level: user.level,
          points: user.points,
          avatarUrl: user.avatar_url,
          isActive: user.is_active,
          isVerified: user.is_verified,
        },
        session: sessionData,
      }
    } catch (error) {
      console.error("Session validation error:", error)
      return { success: false, error: "Session validation failed" }
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // Verify refresh token
      const decoded = verify(refreshToken, this.config.jwtSecret) as any

      // Get session
      const { data: sessionData, error } = await supabaseAdmin
        .from("user_sessions")
        .select(`
          *,
          users (*)
        `)
        .eq("session_token", decoded.sessionId)
        .eq("is_active", true)
        .single()

      if (error || !sessionData) {
        return { success: false, error: "Invalid refresh token" }
      }

      // Check expiration
      if (new Date(sessionData.expires_at) < new Date()) {
        await this.deactivateSession(sessionData.session_token)
        return { success: false, error: "Session expired" }
      }

      const user = sessionData.users as any

      // Generate new access token
      const accessToken = this.generateAccessToken(user)

      // Update session activity
      await this.updateSessionActivity(sessionData.session_token)

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.full_name,
          tier: user.tier,
          coins: user.coins,
          level: user.level,
          points: user.points,
          avatarUrl: user.avatar_url,
          isActive: user.is_active,
          isVerified: user.is_verified,
        },
        tokens: {
          accessToken,
          refreshToken, // Keep same refresh token
          expiresIn: 15 * 60 * 1000, // 15 minutes
        },
      }
    } catch (error) {
      console.error("Token refresh error:", error)
      return { success: false, error: "Token refresh failed" }
    }
  }

  async logout(sessionToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.deactivateSession(sessionToken)
      return { success: true }
    } catch (error) {
      console.error("Logout error:", error)
      return { success: false, error: "Logout failed" }
    }
  }

  // Private helper methods
  private async createSession(data: {
    userId: number
    ipAddress: string
    userAgent: string
    rememberMe: boolean
  }) {
    const sessionToken = this.generateSessionToken()
    const refreshToken = this.generateRefreshToken(sessionToken)
    const now = new Date()
    const expiresAt = new Date(
      now.getTime() + (data.rememberMe ? this.config.rememberMeDuration : this.config.sessionDuration),
    )

    const deviceInfo = {
      userAgent: data.userAgent,
      platform: this.extractPlatform(data.userAgent),
      browser: this.extractBrowser(data.userAgent),
      isMobile: /Mobile|Android|iPhone|iPad/i.test(data.userAgent),
    }

    const { data: session, error } = await supabaseAdmin
      .from("user_sessions")
      .insert({
        user_id: data.userId,
        session_token: sessionToken,
        refresh_token: refreshToken,
        device_info: deviceInfo,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        is_active: true,
        remember_me: data.rememberMe,
        expires_at: expiresAt.toISOString(),
        last_activity: now.toISOString(),
        created_at: now.toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return session
  }

  private async manageConcurrentSessions(userId: number) {
    const { data: sessions } = await supabaseAdmin
      .from("user_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("last_activity", { ascending: false })

    if (sessions && sessions.length >= this.config.maxConcurrentSessions) {
      const sessionsToDeactivate = sessions.slice(this.config.maxConcurrentSessions - 1)

      for (const session of sessionsToDeactivate) {
        await this.deactivateSession(session.session_token)
      }
    }
  }

  private async deactivateSession(sessionToken: string) {
    await supabaseAdmin
      .from("user_sessions")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
      })
      .eq("session_token", sessionToken)
  }

  private async updateSessionActivity(sessionToken: string) {
    await supabaseAdmin
      .from("user_sessions")
      .update({ last_activity: new Date().toISOString() })
      .eq("session_token", sessionToken)
  }

  private async updateLoginStats(userId: number, ipAddress: string) {
    await supabaseAdmin
      .from("users")
      .update({
        last_login: new Date().toISOString(),
        login_count: supabaseAdmin.rpc("increment", {
          table_name: "users",
          column_name: "login_count",
          row_id: userId,
        }),
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq("id", userId)
  }

  private async checkRateLimit(ipAddress: string, action: string) {
    const key = `rate_limit:${action}:${ipAddress}`
    const windowStart = new Date(Date.now() - this.config.rateLimitWindow)

    const { data: attempts } = await supabaseAdmin
      .from("rate_limits")
      .select("*")
      .eq("key", key)
      .gte("created_at", windowStart.toISOString())

    if (attempts && attempts.length >= this.config.maxLoginAttempts) {
      throw new Error("Too many attempts. Please try again later.")
    }

    // Record this attempt
    await supabaseAdmin.from("rate_limits").insert({
      key,
      ip_address: ipAddress,
      action,
      created_at: new Date().toISOString(),
    })
  }

  private async logFailedAttempt(email: string, ipAddress: string) {
    // Increment failed attempts for user
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, failed_login_attempts")
      .eq("email", email)
      .single()

    if (user) {
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1
      const shouldLock = newFailedAttempts >= this.config.maxLoginAttempts

      await supabaseAdmin
        .from("users")
        .update({
          failed_login_attempts: newFailedAttempts,
          locked_until: shouldLock
            ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
            : // 30 minutes
              null,
        })
        .eq("id", user.id)
    }
  }

  private async clearFailedAttempts(email: string) {
    await supabaseAdmin
      .from("users")
      .update({
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq("email", email)
  }

  private generateSessionToken(): string {
    return `sess_${Date.now()}_${randomBytes(32).toString("hex")}`
  }

  private generateAccessToken(user: any): string {
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      username: user.username,
      tier: user.tier,
      role: user.role || "user",
      iat: Math.floor(Date.now() / 1000),
    }

    return sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn,
      issuer: "erigga-platform",
      audience: "erigga-users",
    })
  }

  private generateRefreshToken(sessionId: string): string {
    const payload = {
      sessionId,
      type: "refresh",
      iat: Math.floor(Date.now() / 1000),
    }

    return sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.refreshTokenExpiresIn,
      issuer: "erigga-platform",
      audience: "erigga-users",
    })
  }

  private extractPlatform(userAgent: string): string {
    if (/Windows/i.test(userAgent)) return "Windows"
    if (/Mac/i.test(userAgent)) return "macOS"
    if (/Linux/i.test(userAgent)) return "Linux"
    if (/Android/i.test(userAgent)) return "Android"
    if (/iPhone|iPad/i.test(userAgent)) return "iOS"
    return "Unknown"
  }

  private extractBrowser(userAgent: string): string {
    if (/Chrome/i.test(userAgent)) return "Chrome"
    if (/Firefox/i.test(userAgent)) return "Firefox"
    if (/Safari/i.test(userAgent)) return "Safari"
    if (/Edge/i.test(userAgent)) return "Edge"
    return "Unknown"
  }
}

export const productionAuthService = new ProductionAuthService()
