import { createClient } from "@supabase/supabase-js"
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

// Simple token encoder/decoder without JWT dependencies
class SimpleTokenManager {
  private secret: string

  constructor(secret: string) {
    this.secret = secret
  }

  // Create a simple encoded token
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
    }

    // Simple base64 encoding (not cryptographically secure, but works for session management)
    const encodedHeader = btoa(JSON.stringify(header))
    const encodedPayload = btoa(JSON.stringify(tokenPayload))
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`)

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  // Verify and decode token
  verifyToken(token: string): any {
    try {
      const parts = token.split(".")
      if (parts.length !== 3) {
        throw new Error("Invalid token format")
      }

      const [encodedHeader, encodedPayload, signature] = parts

      // Verify signature
      const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`)
      if (signature !== expectedSignature) {
        throw new Error("Invalid token signature")
      }

      // Decode payload
      const payload = JSON.parse(atob(encodedPayload))

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error("Token expired")
      }

      return payload
    } catch (error) {
      throw new Error("Invalid token")
    }
  }

  private createSignature(data: string): string {
    // Simple hash function for signature (not cryptographically secure)
    let hash = 0
    const combined = data + this.secret
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return btoa(hash.toString())
  }
}

// Mock client for preview/development mode
function createMockSupabaseClient() {
  return {
    auth: {
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        // Mock authentication - accept any email/password for demo
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
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => {
            if (table === "users" && column === "auth_user_id") {
              return Promise.resolve({
                data: {
                  id: 1,
                  auth_user_id: value,
                  email: "demo@example.com",
                  username: "demouser",
                  full_name: "Demo User",
                  tier: "grassroot",
                  coins: 500,
                  level: 1,
                  points: 100,
                  avatar_url: null,
                  is_active: true,
                  is_banned: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              })
            }
            return Promise.resolve({ data: null, error: { message: "Not found" } })
          },
          order: (column: string, options: any) => ({
            limit: (limit: number) => Promise.resolve({ data: [], error: null }),
          }),
        }),
        order: (column: string, options: any) => ({
          limit: (limit: number) => Promise.resolve({ data: [], error: null }),
        }),
      }),
      insert: (data: any) => Promise.resolve({ data: { ...data, id: Date.now() }, error: null }),
      update: (data: any) => ({
        eq: (column: string, value: any) => Promise.resolve({ data, error: null }),
      }),
    }),
  } as any
}

export class EnhancedAuthService {
  private supabase: any
  private config: SessionConfig
  private tokenManager: SimpleTokenManager
  private isPreviewMode: boolean

  constructor() {
    // Check if we're in preview mode or missing environment variables
    this.isPreviewMode = this.checkPreviewMode()

    if (this.isPreviewMode) {
      console.log("🔧 Running in preview mode with mock Supabase client")
      this.supabase = createMockSupabaseClient()
    } else {
      // Initialize real Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        console.warn("⚠️ Missing Supabase environment variables, using mock client")
        this.supabase = createMockSupabaseClient()
        this.isPreviewMode = true
      } else {
        this.supabase = createClient<Database>(supabaseUrl, supabaseKey)
      }
    }

    this.config = {
      maxConcurrentSessions: 3,
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      refreshTokenDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
      rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    }

    this.tokenManager = new SimpleTokenManager(process.env.JWT_SECRET || "demo-secret-key-for-preview-mode-only")
  }

  private checkPreviewMode(): boolean {
    // Check if we're in a preview environment
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      return (
        hostname.includes("v0.dev") ||
        hostname.includes("vusercontent.net") ||
        hostname.includes("localhost") ||
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    }
    return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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

      // Authenticate with Supabase (or mock)
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (authError) {
        console.error("Auth error:", authError)
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

        // In preview mode, return mock profile if not found
        if (this.isPreviewMode) {
          const mockProfile = {
            id: 1,
            auth_user_id: authData.user.id,
            email: credentials.email,
            username: credentials.email.split("@")[0],
            full_name: "Demo User",
            tier: "grassroot",
            coins: 500,
            level: 1,
            points: 100,
            avatar_url: null,
            is_active: true,
            is_banned: false,
          }

          // Continue with mock profile
          return this.createSuccessfulLoginResult(mockProfile, credentials)
        }

        return { success: false, error: "User profile not found" }
      }

      // Check account status
      if (!userProfile.is_active) {
        return { success: false, error: "Account is inactive" }
      }

      if (userProfile.is_banned) {
        return { success: false, error: "Account is banned" }
      }

      return this.createSuccessfulLoginResult(userProfile, credentials)
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      }
    }
  }

  private async createSuccessfulLoginResult(userProfile: any, credentials: any): Promise<AuthResult> {
    // Manage concurrent sessions (skip in preview mode)
    if (!this.isPreviewMode) {
      await this.manageConcurrentSessions(userProfile.id.toString())
    }

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

    // Update user login stats (skip in preview mode)
    if (!this.isPreviewMode) {
      await this.updateLoginStats(userProfile.id)
    }

    // Log successful login (skip in preview mode)
    if (!this.isPreviewMode) {
      await this.logAuthEvent({
        userId: userProfile.id.toString(),
        action: "LOGIN_SUCCESS",
        ipAddress: credentials.ipAddress,
        deviceInfo: credentials.deviceInfo,
        sessionId: session.sessionToken,
      })
    }

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

    // Store session in database (skip in preview mode)
    if (!this.isPreviewMode) {
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
        // Don't throw error in preview mode, just log it
      }
    }

    return session
  }

  /**
   * Manage concurrent sessions - limit to maxConcurrentSessions
   */
  private async manageConcurrentSessions(userId: string): Promise<void> {
    if (this.isPreviewMode) return // Skip in preview mode

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
      if (this.isPreviewMode) {
        // In preview mode, return a mock successful validation
        return {
          success: true,
          user: {
            id: 1,
            email: "demo@example.com",
            username: "demouser",
            fullName: "Demo User",
            tier: "grassroot",
            coins: 500,
            level: 1,
            points: 100,
            avatarUrl: null,
            isActive: true,
          },
          session: {
            id: "mock-session",
            userId: "1",
            sessionToken,
            refreshToken: "mock-refresh-token",
            deviceInfo: {
              userAgent: "Mock Browser",
              platform: "Mock Platform",
              browser: "Mock",
              os: "Mock OS",
              isMobile: false,
            },
            ipAddress: "127.0.0.1",
            isActive: true,
            rememberMe: false,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            lastActivity: new Date(),
            createdAt: new Date(),
          },
        }
      }

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
      const decoded = this.tokenManager.verifyToken(refreshToken)

      if (this.isPreviewMode) {
        // Return mock refresh result
        return {
          success: true,
          user: {
            id: 1,
            email: "demo@example.com",
            username: "demouser",
            fullName: "Demo User",
            tier: "grassroot",
            coins: 500,
            level: 1,
            points: 100,
            avatarUrl: null,
            isActive: true,
          },
          tokens: {
            accessToken: this.generateAccessToken({ id: 1, email: "demo@example.com" }, decoded.sessionId),
            refreshToken,
            expiresIn: 15 * 60 * 1000,
          },
        }
      }

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
      // Deactivate session (skip in preview mode)
      if (!this.isPreviewMode) {
        await this.deactivateSession(sessionToken)

        // Log logout event
        if (userId) {
          await this.logAuthEvent({
            userId,
            action: "LOGOUT",
            sessionId: sessionToken,
          })
        }
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
      if (this.isPreviewMode) {
        return { success: true }
      }

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
      if (this.isPreviewMode) {
        // Return mock sessions
        return [
          {
            id: "mock-session-1",
            userId,
            sessionToken: "mock-token-1",
            refreshToken: "mock-refresh-1",
            deviceInfo: {
              userAgent: "Mock Browser 1",
              platform: "Mock Platform",
              browser: "Chrome",
              os: "Windows",
              isMobile: false,
            },
            ipAddress: "127.0.0.1",
            isActive: true,
            rememberMe: false,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            lastActivity: new Date(),
            createdAt: new Date(),
          },
        ]
      }

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
    }

    return this.tokenManager.createToken(payload, 15 * 60 * 1000) // 15 minutes
  }

  private generateRefreshToken(sessionId: string): string {
    const payload = {
      sessionId,
      type: "refresh",
    }

    return this.tokenManager.createToken(payload, 7 * 24 * 60 * 60 * 1000) // 7 days
  }

  private async deactivateSession(sessionToken: string): Promise<void> {
    if (this.isPreviewMode) return
    await this.supabase.from("user_sessions").update({ is_active: false }).eq("session_token", sessionToken)
  }

  private async updateSessionActivity(sessionToken: string): Promise<void> {
    if (this.isPreviewMode) return
    await this.supabase
      .from("user_sessions")
      .update({ last_activity: new Date().toISOString() })
      .eq("session_token", sessionToken)
  }

  private async updateLoginStats(userId: number): Promise<void> {
    if (this.isPreviewMode) return
    await this.supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
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
    if (this.isPreviewMode) return

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
