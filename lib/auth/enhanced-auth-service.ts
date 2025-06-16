import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"
import type { Database } from "@/types/database"

interface SessionConfig {
  maxConcurrentSessions: number
  sessionDuration: number
  refreshTokenDuration: number
  rememberMeDuration: number
}

interface DeviceInfo {
  userAgent: string
  platform: string
  browser: string
  os: string
  isMobile: boolean
}

interface UserSession {
  id: string
  userId: string
  sessionToken: string
  refreshToken: string
  deviceInfo: DeviceInfo
  ipAddress: string
  isActive: boolean
  rememberMe: boolean
  expiresAt: Date
  lastActivity: Date
  createdAt: Date
}

interface AuthResult {
  success: boolean
  user?: any
  session?: UserSession
  tokens?: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
  error?: string
}

// Production-grade token manager with crypto
class ProductionTokenManager {
  private secret: string

  constructor(secret: string) {
    if (!secret || secret.length < 32) {
      throw new Error("JWT secret must be at least 32 characters long for production")
    }
    this.secret = secret
  }

  createToken(payload: any, expiresIn: number): string {
    const header = {
      typ: "JWT",
      alg: "HS256",
    }

    const now = Math.floor(Date.now() / 1000)
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + Math.floor(expiresIn / 1000),
      jti: uuidv4(), // JWT ID for token tracking
    }

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
    const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload))
    const signature = this.createHmacSignature(`${encodedHeader}.${encodedPayload}`)

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  verifyToken(token: string): any {
    try {
      const parts = token.split(".")
      if (parts.length !== 3) {
        throw new Error("Invalid token format")
      }

      const [encodedHeader, encodedPayload, signature] = parts

      // Verify signature
      const expectedSignature = this.createHmacSignature(`${encodedHeader}.${encodedPayload}`)
      if (signature !== expectedSignature) {
        throw new Error("Invalid token signature")
      }

      // Decode and validate payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload))

      // Check expiration
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

  private createHmacSignature(data: string): string {
    // Production-grade HMAC implementation
    const crypto = require("crypto")
    return crypto.createHmac("sha256", this.secret).update(data).digest("base64url")
  }
}

export class EnhancedAuthService {
  private supabase: ReturnType<typeof createClient<Database>>
  private config: SessionConfig
  private tokenManager: ProductionTokenManager

  constructor() {
    // Validate required environment variables
    this.validateEnvironment()

    // Initialize Supabase client with production configuration
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false, // We handle sessions manually
          detectSessionInUrl: false,
        },
        db: {
          schema: "public",
        },
        global: {
          headers: {
            "X-Client-Info": "erigga-platform@1.0.0",
          },
        },
      },
    )

    this.config = {
      maxConcurrentSessions: 3,
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      refreshTokenDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
      rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    }

    this.tokenManager = new ProductionTokenManager(process.env.JWT_SECRET!)
  }

  private validateEnvironment(): void {
    const requiredVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "JWT_SECRET",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]

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
    } catch {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")
    }
  }

  async login(credentials: {
    email: string
    password: string
    rememberMe?: boolean
    deviceInfo: DeviceInfo
    ipAddress: string
  }): Promise<AuthResult> {
    try {
      // Enhanced input validation
      if (!credentials.email || !credentials.password) {
        return { success: false, error: "Email and password are required" }
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
        return { success: false, error: "Invalid email format" }
      }

      if (credentials.password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters long" }
      }

      // Rate limiting check
      await this.checkRateLimit(credentials.ipAddress, "login")

      // Authenticate with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (authError) {
        await this.logAuthEvent({
          action: "LOGIN_FAILED",
          ipAddress: credentials.ipAddress,
          deviceInfo: credentials.deviceInfo,
          metadata: { error: authError.message, email: credentials.email },
        })

        return {
          success: false,
          error: this.getAuthErrorMessage(authError.message),
        }
      }

      if (!authData.user) {
        return { success: false, error: "Authentication failed" }
      }

      // Get user profile with enhanced error handling
      const { data: userProfile, error: profileError } = await this.supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", authData.user.id)
        .single()

      if (profileError || !userProfile) {
        console.error("Profile fetch error:", profileError)
        await this.logAuthEvent({
          userId: authData.user.id,
          action: "PROFILE_FETCH_FAILED",
          ipAddress: credentials.ipAddress,
          metadata: { error: profileError?.message },
        })
        return { success: false, error: "User profile not found" }
      }

      // Enhanced account status checks
      if (!userProfile.is_active) {
        await this.logAuthEvent({
          userId: userProfile.id.toString(),
          action: "LOGIN_BLOCKED_INACTIVE",
          ipAddress: credentials.ipAddress,
        })
        return { success: false, error: "Account is inactive. Please contact support." }
      }

      if (userProfile.is_banned) {
        await this.logAuthEvent({
          userId: userProfile.id.toString(),
          action: "LOGIN_BLOCKED_BANNED",
          ipAddress: credentials.ipAddress,
        })
        return { success: false, error: "Account is banned. Please contact support." }
      }

      // Manage concurrent sessions
      await this.manageConcurrentSessions(userProfile.id.toString())

      // Create new session
      const session = await this.createSession({
        userId: userProfile.id.toString(),
        deviceInfo: credentials.deviceInfo,
        ipAddress: credentials.ipAddress,
        rememberMe: credentials.rememberMe || false,
      })

      // Generate production tokens
      const accessToken = this.generateAccessToken(userProfile, session.sessionToken)
      const refreshToken = this.generateRefreshToken(session.sessionToken)

      // Update user login statistics
      await this.updateLoginStats(userProfile.id)

      // Log successful login
      await this.logAuthEvent({
        userId: userProfile.id.toString(),
        action: "LOGIN_SUCCESS",
        ipAddress: credentials.ipAddress,
        deviceInfo: credentials.deviceInfo,
        sessionId: session.sessionToken,
      })

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
        },
        session,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: credentials.rememberMe ? this.config.rememberMeDuration : this.config.sessionDuration,
        },
      }
    } catch (error) {
      console.error("Login error:", error)
      await this.logAuthEvent({
        action: "LOGIN_ERROR",
        ipAddress: credentials.ipAddress,
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      }
    }
  }

  private async createSession(sessionData: {
    userId: string
    deviceInfo: DeviceInfo
    ipAddress: string
    rememberMe: boolean
  }): Promise<UserSession> {
    const sessionToken = this.generateSessionToken()
    const refreshToken = this.generateRefreshToken(sessionToken)
    const now = new Date()
    const expiresAt = new Date(
      now.getTime() + (sessionData.rememberMe ? this.config.rememberMeDuration : this.config.sessionDuration),
    )

    const session: UserSession = {
      id: uuidv4(),
      userId: sessionData.userId,
      sessionToken,
      refreshToken,
      deviceInfo: sessionData.deviceInfo,
      ipAddress: sessionData.ipAddress,
      isActive: true,
      rememberMe: sessionData.rememberMe,
      expiresAt,
      lastActivity: now,
      createdAt: now,
    }

    // Store session in database with error handling
    const { error } = await this.supabase.from("user_sessions").insert({
      user_id: Number.parseInt(sessionData.userId),
      session_token: sessionToken,
      refresh_token: refreshToken,
      device_info: sessionData.deviceInfo,
      ip_address: sessionData.ipAddress,
      is_active: true,
      remember_me: sessionData.rememberMe,
      expires_at: expiresAt.toISOString(),
      last_activity: now.toISOString(),
      created_at: now.toISOString(),
    })

    if (error) {
      console.error("Session creation error:", error)
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return session
  }

  private async manageConcurrentSessions(userId: string): Promise<void> {
    try {
      const { data: sessions, error } = await this.supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", Number.parseInt(userId))
        .eq("is_active", true)
        .order("last_activity", { ascending: false })

      if (error) {
        console.error("Error fetching sessions:", error)
        return
      }

      if (sessions && sessions.length >= this.config.maxConcurrentSessions) {
        const sessionsToDeactivate = sessions.slice(this.config.maxConcurrentSessions - 1)

        for (const session of sessionsToDeactivate) {
          await this.supabase
            .from("user_sessions")
            .update({ is_active: false, deactivated_at: new Date().toISOString() })
            .eq("session_token", session.session_token)
        }

        await this.logAuthEvent({
          userId,
          action: "SESSION_CLEANUP",
          metadata: {
            deactivatedSessions: sessionsToDeactivate.length,
            reason: "max_concurrent_sessions_exceeded",
          },
        })
      }
    } catch (error) {
      console.error("Session management error:", error)
    }
  }

  async validateSession(sessionToken: string): Promise<AuthResult> {
    try {
      const { data: sessionData, error } = await this.supabase
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

      if (new Date(sessionData.expires_at) < new Date()) {
        await this.deactivateSession(sessionToken)
        return { success: false, error: "Session expired" }
      }

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
        },
        session: {
          id: sessionData.id,
          userId: user.id.toString(),
          sessionToken: sessionData.session_token,
          refreshToken: sessionData.refresh_token,
          deviceInfo: sessionData.device_info as DeviceInfo,
          ipAddress: sessionData.ip_address,
          isActive: sessionData.is_active,
          rememberMe: sessionData.remember_me,
          expiresAt: new Date(sessionData.expires_at),
          lastActivity: new Date(sessionData.last_activity),
          createdAt: new Date(sessionData.created_at),
        },
      }
    } catch (error) {
      console.error("Session validation error:", error)
      return { success: false, error: "Session validation failed" }
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const decoded = this.tokenManager.verifyToken(refreshToken)

      const { data: sessionData, error } = await this.supabase
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

      if (new Date(sessionData.expires_at) < new Date()) {
        await this.deactivateSession(sessionData.session_token)
        return { success: false, error: "Session expired" }
      }

      const user = sessionData.users as any
      const accessToken = this.generateAccessToken(user, sessionData.session_token)

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
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 15 * 60 * 1000,
        },
      }
    } catch (error) {
      console.error("Token refresh error:", error)
      return { success: false, error: "Token refresh failed" }
    }
  }

  async logout(sessionToken: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.deactivateSession(sessionToken)

      if (userId) {
        await this.logAuthEvent({
          userId,
          action: "LOGOUT",
          sessionId: sessionToken,
        })
      }

      return { success: true }
    } catch (error) {
      console.error("Logout error:", error)
      return { success: false, error: "Logout failed" }
    }
  }

  async logoutAllDevices(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("user_sessions")
        .update({ is_active: false, deactivated_at: new Date().toISOString() })
        .eq("user_id", Number.parseInt(userId))

      if (error) throw error

      await this.logAuthEvent({
        userId,
        action: "LOGOUT_ALL_DEVICES",
      })

      return { success: true }
    } catch (error) {
      console.error("Logout all devices error:", error)
      return { success: false, error: "Failed to logout from all devices" }
    }
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const { data: sessions, error } = await this.supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", Number.parseInt(userId))
        .eq("is_active", true)
        .order("last_activity", { ascending: false })

      if (error) {
        console.error("Error fetching user sessions:", error)
        return []
      }

      return sessions.map((session) => ({
        id: session.id.toString(),
        userId: session.user_id.toString(),
        sessionToken: session.session_token,
        refreshToken: session.refresh_token,
        deviceInfo: session.device_info as DeviceInfo,
        ipAddress: session.ip_address,
        isActive: session.is_active,
        rememberMe: session.remember_me,
        expiresAt: new Date(session.expires_at),
        lastActivity: new Date(session.last_activity),
        createdAt: new Date(session.created_at),
      }))
    } catch (error) {
      console.error("Error getting user sessions:", error)
      return []
    }
  }

  // Rate limiting
  private async checkRateLimit(ipAddress: string, action: string): Promise<void> {
    const key = `rate_limit:${action}:${ipAddress}`
    const window = 15 * 60 * 1000 // 15 minutes
    const maxAttempts = action === "login" ? 5 : 10

    // Implementation would use Redis in production
    // For now, we'll use database-based rate limiting
    const { data: attempts, error } = await this.supabase
      .from("rate_limits")
      .select("*")
      .eq("key", key)
      .gte("created_at", new Date(Date.now() - window).toISOString())

    if (error) {
      console.error("Rate limit check error:", error)
      return // Allow request if rate limit check fails
    }

    if (attempts && attempts.length >= maxAttempts) {
      throw new Error("Too many attempts. Please try again later.")
    }

    // Record this attempt
    await this.supabase.from("rate_limits").insert({
      key,
      ip_address: ipAddress,
      action,
      created_at: new Date().toISOString(),
    })
  }

  // Helper methods
  private generateSessionToken(): string {
    return `sess_${Date.now()}_${uuidv4().replace(/-/g, "")}`
  }

  private generateAccessToken(user: any, sessionId: string): string {
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      username: user.username,
      tier: user.tier,
      role: user.role || "user",
      sessionId,
      scope: "access",
    }

    return this.tokenManager.createToken(payload, 15 * 60 * 1000) // 15 minutes
  }

  private generateRefreshToken(sessionId: string): string {
    const payload = {
      sessionId,
      type: "refresh",
      scope: "refresh",
    }

    return this.tokenManager.createToken(payload, 7 * 24 * 60 * 60 * 1000) // 7 days
  }

  private async deactivateSession(sessionToken: string): Promise<void> {
    await this.supabase
      .from("user_sessions")
      .update({ is_active: false, deactivated_at: new Date().toISOString() })
      .eq("session_token", sessionToken)
  }

  private async updateSessionActivity(sessionToken: string): Promise<void> {
    await this.supabase
      .from("user_sessions")
      .update({ last_activity: new Date().toISOString() })
      .eq("session_token", sessionToken)
  }

  private async updateLoginStats(userId: number): Promise<void> {
    await this.supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
        login_count: this.supabase.rpc("increment", {
          table_name: "users",
          column_name: "login_count",
          row_id: userId,
        }),
      })
      .eq("id", userId)
  }

  private async logAuthEvent(event: {
    userId?: string
    action: string
    ipAddress?: string
    deviceInfo?: DeviceInfo
    sessionId?: string
    metadata?: any
  }): Promise<void> {
    try {
      await this.supabase.from("audit_logs").insert({
        user_id: event.userId ? Number.parseInt(event.userId) : null,
        action: event.action,
        ip_address: event.ipAddress,
        user_agent: event.deviceInfo?.userAgent,
        metadata: {
          ...event.metadata,
          sessionId: event.sessionId,
          deviceInfo: event.deviceInfo,
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error logging auth event:", error)
    }
  }

  private getAuthErrorMessage(error: string): string {
    const errorMap: Record<string, string> = {
      "Invalid login credentials": "Invalid email or password",
      "Email not confirmed": "Please verify your email address",
      "Too many requests": "Too many login attempts. Please try again later",
      "User not found": "No account found with this email",
      "Signup not allowed": "Account registration is currently disabled",
      "Password should be at least 6 characters": "Password must be at least 8 characters long",
    }

    return errorMap[error] || error || "Authentication failed"
  }
}

export const enhancedAuthService = new EnhancedAuthService()
