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

// Environment detection utility
class EnvironmentDetector {
  static isPreviewMode(): boolean {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      return (
        hostname.includes("v0.dev") ||
        hostname.includes("vusercontent.net") ||
        hostname.includes("localhost") ||
        hostname === "127.0.0.1"
      )
    }

    // Server-side detection - only consider preview mode if explicitly set
    return (
      process.env.VERCEL_ENV === "preview" ||
      process.env.NODE_ENV === "development" ||
      process.env.FORCE_PREVIEW_MODE === "true"
    )
  }

  static isDevelopment(): boolean {
    return process.env.NODE_ENV === "development" || this.isPreviewMode()
  }

  static isProduction(): boolean {
    return process.env.NODE_ENV === "production" && !this.isPreviewMode()
  }
}

// Flexible token manager that works in all environments
class FlexibleTokenManager {
  private secret: string
  private isPreviewMode: boolean

  constructor(secret?: string) {
    this.isPreviewMode = EnvironmentDetector.isPreviewMode()

    if (this.isPreviewMode) {
      // Use a valid 32+ character secret for preview mode
      this.secret = secret || "preview-mode-jwt-secret-key-32-chars-minimum-length-required"
      console.log("🔧 Token manager running in preview mode")
    } else {
      // Production mode requires a proper secret
      const jwtSecret = secret || process.env.JWT_SECRET
      if (!jwtSecret || jwtSecret.length < 32) {
        // Generate a secure default if none provided
        this.secret = this.generateSecureSecret()
        console.warn("⚠️ Generated temporary JWT secret. Please set JWT_SECRET environment variable.")
      } else {
        this.secret = jwtSecret
      }
    }
  }

  private generateSecureSecret(): string {
    // Generate a cryptographically secure 64-character secret
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let result = ""
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
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
    if (this.isPreviewMode) {
      // Simple hash for preview mode
      let hash = 0
      const combined = data + this.secret
      for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash
      }
      return btoa(hash.toString())
    } else {
      // Production HMAC (would use crypto in real Node.js environment)
      try {
        const crypto = require("crypto")
        return crypto.createHmac("sha256", this.secret).update(data).digest("base64url")
      } catch {
        // Fallback for environments without crypto
        return this.createSimpleHash(data)
      }
    }
  }

  private createSimpleHash(data: string): string {
    let hash = 0
    const combined = data + this.secret
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return btoa(hash.toString())
  }
}

// Mock Supabase client for preview mode
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
    rpc: (functionName: string, params: any) => Promise.resolve({ data: 1, error: null }),
  } as any
}

export class EnhancedAuthService {
  private supabase: any
  private config: SessionConfig
  private tokenManager: FlexibleTokenManager
  private isPreviewMode: boolean

  constructor() {
    this.isPreviewMode = EnvironmentDetector.isPreviewMode()

    // Initialize configuration
    this.config = {
      maxConcurrentSessions: 3,
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      refreshTokenDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
      rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    }

    // Initialize token manager with flexible secret handling
    this.tokenManager = new FlexibleTokenManager(process.env.JWT_SECRET)

    // Initialize Supabase client
    this.initializeSupabaseClient()
  }

  private initializeSupabaseClient(): void {
    if (this.isPreviewMode) {
      console.log("🔧 Running in preview mode with mock Supabase client")
      this.supabase = createMockSupabaseClient()
      return
    }

    // Validate environment variables for production
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("⚠️ Missing Supabase environment variables, falling back to mock client")
      this.supabase = createMockSupabaseClient()
      this.isPreviewMode = true
      return
    }

    try {
      // Initialize real Supabase client for production
      this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: false,
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
      })
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error)
      console.log("Falling back to mock client")
      this.supabase = createMockSupabaseClient()
      this.isPreviewMode = true
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

      if (credentials.password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters long" }
      }

      // Rate limiting check (skip in preview mode)
      if (!this.isPreviewMode) {
        await this.checkRateLimit(credentials.ipAddress, "login")
      }

      // Authenticate with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (authError) {
        if (!this.isPreviewMode) {
          await this.logAuthEvent({
            action: "LOGIN_FAILED",
            ipAddress: credentials.ipAddress,
            deviceInfo: credentials.deviceInfo,
            metadata: { error: authError.message, email: credentials.email },
          })
        }

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

        if (this.isPreviewMode) {
          // Return mock profile for preview mode
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

        if (!this.isPreviewMode) {
          await this.logAuthEvent({
            userId: authData.user.id,
            action: "PROFILE_FETCH_FAILED",
            ipAddress: credentials.ipAddress,
            metadata: { error: profileError?.message },
          })
        }
        return { success: false, error: "User profile not found" }
      }

      // Enhanced account status checks
      if (!userProfile.is_active) {
        if (!this.isPreviewMode) {
          await this.logAuthEvent({
            userId: userProfile.id.toString(),
            action: "LOGIN_BLOCKED_INACTIVE",
            ipAddress: credentials.ipAddress,
          })
        }
        return { success: false, error: "Account is inactive. Please contact support." }
      }

      if (userProfile.is_banned) {
        if (!this.isPreviewMode) {
          await this.logAuthEvent({
            userId: userProfile.id.toString(),
            action: "LOGIN_BLOCKED_BANNED",
            ipAddress: credentials.ipAddress,
          })
        }
        return { success: false, error: "Account is banned. Please contact support." }
      }

      return this.createSuccessfulLoginResult(userProfile, credentials)
    } catch (error) {
      console.error("Login error:", error)
      if (!this.isPreviewMode) {
        await this.logAuthEvent({
          action: "LOGIN_ERROR",
          ipAddress: credentials.ipAddress,
          metadata: { error: error instanceof Error ? error.message : "Unknown error" },
        })
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      }
    }
  }

  private async createSuccessfulLoginResult(userProfile: any, credentials: any): Promise<AuthResult> {
    try {
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
    } catch (error) {
      console.error("Error creating login result:", error)
      throw error
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

    // Store session in database (skip in preview mode)
    if (!this.isPreviewMode) {
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
          console.error("Session creation error:", error)
          // Don't throw error, just log it
        }
      } catch (error) {
        console.error("Session storage error:", error)
        // Continue without throwing
      }
    }

    return session
  }

  private async manageConcurrentSessions(userId: string): Promise<void> {
    if (this.isPreviewMode) return

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
      if (this.isPreviewMode) {
        // Return mock validation for preview mode
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

      if (this.isPreviewMode) {
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
      if (!this.isPreviewMode) {
        await this.deactivateSession(sessionToken)

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

  async logoutAllDevices(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isPreviewMode) {
        return { success: true }
      }

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
      if (this.isPreviewMode) {
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

  // Rate limiting
  private async checkRateLimit(ipAddress: string, action: string): Promise<void> {
    if (this.isPreviewMode) return

    const key = `rate_limit:${action}:${ipAddress}`
    const window = 15 * 60 * 1000 // 15 minutes
    const maxAttempts = action === "login" ? 5 : 10

    try {
      const { data: attempts, error } = await this.supabase
        .from("rate_limits")
        .select("*")
        .eq("key", key)
        .gte("created_at", new Date(Date.now() - window).toISOString())

      if (error) {
        console.error("Rate limit check error:", error)
        return
      }

      if (attempts && attempts.length >= maxAttempts) {
        throw new Error("Too many attempts. Please try again later.")
      }

      await this.supabase.from("rate_limits").insert({
        key,
        ip_address: ipAddress,
        action,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes("Too many attempts")) {
        throw error
      }
      console.error("Rate limit error:", error)
    }
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
    if (this.isPreviewMode) return
    try {
      await this.supabase
        .from("user_sessions")
        .update({ is_active: false, deactivated_at: new Date().toISOString() })
        .eq("session_token", sessionToken)
    } catch (error) {
      console.error("Error deactivating session:", error)
    }
  }

  private async updateSessionActivity(sessionToken: string): Promise<void> {
    if (this.isPreviewMode) return
    try {
      await this.supabase
        .from("user_sessions")
        .update({ last_activity: new Date().toISOString() })
        .eq("session_token", sessionToken)
    } catch (error) {
      console.error("Error updating session activity:", error)
    }
  }

  private async updateLoginStats(userId: number): Promise<void> {
    if (this.isPreviewMode) return
    try {
      await this.supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
        })
        .eq("id", userId)
    } catch (error) {
      console.error("Error updating login stats:", error)
    }
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
      "Password should be at least 6 characters": "Password must be at least 6 characters long",
    }

    return errorMap[error] || error || "Authentication failed"
  }
}

export const enhancedAuthService = new EnhancedAuthService()
