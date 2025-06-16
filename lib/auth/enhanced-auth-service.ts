import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"
import type { Database } from "@/types/database"

interface SessionConfig {
  maxConcurrentSessions: number
  sessionDuration: number // in milliseconds
  refreshTokenDuration: number // in milliseconds
  rememberMeDuration: number // in milliseconds
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

export class EnhancedAuthService {
  private supabase: ReturnType<typeof createClient<Database>>
  private config: SessionConfig

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    this.config = {
      maxConcurrentSessions: 3,
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      refreshTokenDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
      rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  }

  /**
   * Enhanced login with session management and remember me functionality
   */
  async login(credentials: {
    email: string
    password: string
    rememberMe?: boolean
    deviceInfo: DeviceInfo
    ipAddress: string
  }): Promise<AuthResult> {
    try {
      // Input validation
      if (!credentials.email || !credentials.password) {
        return { success: false, error: "Email and password are required" }
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
        return { success: false, error: "Invalid email format" }
      }

      // Authenticate with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (authError) {
        console.error("Supabase auth error:", authError)
        return {
          success: false,
          error: this.getAuthErrorMessage(authError.message),
        }
      }

      if (!authData.user) {
        return { success: false, error: "Authentication failed" }
      }

      // Get user profile
      const { data: userProfile, error: profileError } = await this.supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", authData.user.id)
        .single()

      if (profileError || !userProfile) {
        console.error("Profile fetch error:", profileError)
        return { success: false, error: "User profile not found" }
      }

      // Check account status
      if (!userProfile.is_active) {
        return { success: false, error: "Account is inactive" }
      }

      if (userProfile.is_banned) {
        return { success: false, error: "Account is banned" }
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

      // Generate tokens
      const accessToken = this.generateAccessToken(userProfile, session.sessionToken)
      const refreshToken = this.generateRefreshToken(session.sessionToken)

      // Update user login stats
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
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      }
    }
  }

  /**
   * Create a new user session with device tracking
   */
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

    // Store session in database
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
      throw new Error("Failed to create session")
    }

    return session
  }

  /**
   * Manage concurrent sessions - limit to maxConcurrentSessions
   */
  private async manageConcurrentSessions(userId: string): Promise<void> {
    try {
      // Get all active sessions for user
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
        // Deactivate oldest sessions
        const sessionsToDeactivate = sessions.slice(this.config.maxConcurrentSessions - 1)

        for (const session of sessionsToDeactivate) {
          await this.supabase
            .from("user_sessions")
            .update({ is_active: false })
            .eq("session_token", session.session_token)
        }

        // Log session cleanup
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

  /**
   * Validate and refresh session
   */
  async validateSession(sessionToken: string): Promise<AuthResult> {
    try {
      // Get session from database
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

      // Check if session is expired
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

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // Validate refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any

      // Get session
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

      // Check if session is expired
      if (new Date(sessionData.expires_at) < new Date()) {
        await this.deactivateSession(sessionData.session_token)
        return { success: false, error: "Session expired" }
      }

      const user = sessionData.users as any

      // Generate new access token
      const accessToken = this.generateAccessToken(user, sessionData.session_token)

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
        },
        tokens: {
          accessToken,
          refreshToken, // Keep the same refresh token
          expiresIn: 15 * 60 * 1000, // 15 minutes
        },
      }
    } catch (error) {
      console.error("Token refresh error:", error)
      return { success: false, error: "Token refresh failed" }
    }
  }

  /**
   * Logout user and deactivate session
   */
  async logout(sessionToken: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Deactivate session
      await this.deactivateSession(sessionToken)

      // Log logout event
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

  /**
   * Logout from all devices
   */
  async logoutAllDevices(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Deactivate all sessions for user
      const { error } = await this.supabase
        .from("user_sessions")
        .update({ is_active: false })
        .eq("user_id", Number.parseInt(userId))

      if (error) {
        throw error
      }

      // Log logout all event
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

  /**
   * Get user's active sessions
   */
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

  // Private helper methods
  private generateSessionToken(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
  }

  private generateAccessToken(user: any, sessionId: string): string {
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      username: user.username,
      tier: user.tier,
      role: user.role || "user",
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    }

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      algorithm: "HS256",
      issuer: "erigga-platform",
      audience: "erigga-users",
    })
  }

  private generateRefreshToken(sessionId: string): string {
    const payload = {
      sessionId,
      type: "refresh",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    }

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      algorithm: "HS256",
      issuer: "erigga-platform",
      audience: "erigga-users",
    })
  }

  private async deactivateSession(sessionToken: string): Promise<void> {
    await this.supabase.from("user_sessions").update({ is_active: false }).eq("session_token", sessionToken)
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
        login_count: this.supabase.rpc("increment_login_count", { user_id: userId }),
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
        },
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error logging auth event:", error)
    }
  }

  private getAuthErrorMessage(error: string): string {
    switch (error) {
      case "Invalid login credentials":
        return "Invalid email or password"
      case "Email not confirmed":
        return "Please verify your email address"
      case "Too many requests":
        return "Too many login attempts. Please try again later"
      case "User not found":
        return "No account found with this email"
      default:
        return error || "Authentication failed"
    }
  }
}

export const enhancedAuthService = new EnhancedAuthService()
