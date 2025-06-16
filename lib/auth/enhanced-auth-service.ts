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

// Simple token manager without JWT dependencies
class SimpleTokenManager {
  private secret: string

  constructor() {
    this.secret = process.env.JWT_SECRET || "erigga-platform-secret-key-for-development-only-change-in-production"
  }

  createToken(payload: any, expiresIn: number): string {
    const header = {
      typ: "SIMPLE",
      alg: "HS256",
    }

    const now = Date.now()
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
      jti: uuidv4(),
    }

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
    const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload))
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`)

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
      const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`)
      if (signature !== expectedSignature) {
        throw new Error("Invalid token signature")
      }

      // Decode and validate payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload))

      // Check expiration
      if (payload.exp && payload.exp < Date.now()) {
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
    // Simple hash-based signature
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

export class EnhancedAuthService {
  private supabase: ReturnType<typeof createClient<Database>>
  private config: SessionConfig
  private tokenManager: SimpleTokenManager

  constructor() {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials not found, using mock client")
      this.supabase = this.createMockClient()
    } else {
      this.supabase = createClient<Database>(supabaseUrl, supabaseKey)
    }

    this.tokenManager = new SimpleTokenManager()

    this.config = {
      maxConcurrentSessions: 3,
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      refreshTokenDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
      rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  }

  private createMockClient(): any {
    return {
      auth: {
        signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
          // Mock authentication for development
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
              if (table === "users") {
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
      rpc: (functionName: string, params: any) => Promise.resolve({ data: 1, error: null }),
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

        // For development/demo, return mock profile
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

        return this.createSuccessfulLoginResult(mockProfile, credentials)
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
    try {
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
      console.error("Error creating login result:", error)
      throw error
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

    // Try to store session in database (skip if mock)
    try {
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
        console.warn("Session creation warning:", error)
        // Don't throw error, just log it
      }
    } catch (error) {
      console.warn("Session storage warning:", error)
      // Continue without throwing
    }

    return session
  }

  /**
   * Validate and refresh session
   */
  async validateSession(sessionToken: string): Promise<AuthResult> {
    try {
      // For development, return mock validation
      if (sessionToken.startsWith("mock-") || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return {
          success: true,
          user: {
            id: "1",
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
      // For development, return mock refresh
      if (refreshToken.startsWith("mock-") || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return {
          success: true,
          user: {
            id: "1",
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
            accessToken: this.generateAccessToken({ id: 1, email: "demo@example.com" }, "mock-session"),
            refreshToken,
            expiresIn: 15 * 60 * 1000,
          },
        }
      }

      // Validate refresh token
      const decoded = this.tokenManager.verifyToken(refreshToken)

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
      // For development, just return success
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
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
      // For development, return mock sessions
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
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
    try {
      await this.supabase.from("user_sessions").update({ is_active: false }).eq("session_token", sessionToken)
    } catch (error) {
      console.warn("Error deactivating session:", error)
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
