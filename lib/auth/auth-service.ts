import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { rateLimit } from "@/lib/security/rate-limiter"
import { validateInput } from "@/lib/security/input-validator"
import { auditLogger } from "@/lib/security/audit-logger"
import type { Database } from "@/types/database"

interface AuthConfig {
  jwtSecret: string
  jwtExpiresIn: string
  refreshTokenExpiresIn: string
  maxLoginAttempts: number
  lockoutDuration: number
}

interface LoginAttempt {
  email: string
  ip: string
  userAgent: string
  timestamp: Date
  success: boolean
}

interface UserSession {
  userId: string
  sessionId: string
  deviceInfo: any
  ipAddress: string
  expiresAt: Date
  isActive: boolean
}

export class AuthService {
  private supabase: ReturnType<typeof createClient<Database>>
  private config: AuthConfig

  constructor() {
    this.supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    this.config = {
      jwtSecret: process.env.JWT_SECRET || "fallback-secret-change-in-production",
      jwtExpiresIn: "15m",
      refreshTokenExpiresIn: "7d",
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
    }
  }

  // Secure user registration with comprehensive validation
  async registerUser(userData: {
    email: string
    password: string
    username: string
    fullName: string
    ipAddress: string
    userAgent: string
  }) {
    try {
      // Rate limiting
      await rateLimit.checkLimit(`register:${userData.ipAddress}`, 3, 3600) // 3 attempts per hour

      // Input validation
      const validationResult = validateInput.user(userData)
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(", ")}`)
      }

      // Check if user already exists
      const { data: existingUser } = await this.supabase
        .from("users")
        .select("id, email, username")
        .or(`email.eq.${userData.email},username.eq.${userData.username}`)
        .single()

      if (existingUser) {
        const field = existingUser.email === userData.email ? "email" : "username"
        throw new Error(`User with this ${field} already exists`)
      }

      // Hash password with salt
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds)

      // Create user with Supabase Auth
      const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          username: userData.username,
          full_name: userData.fullName,
        },
      })

      if (authError) throw authError

      // Create user profile
      const { data: userProfile, error: profileError } = await this.supabase
        .from("users")
        .insert({
          auth_user_id: authUser.user.id,
          email: userData.email,
          username: userData.username,
          full_name: userData.fullName,
          tier: "grassroot",
          coins: 500, // Welcome bonus
          level: 1,
          points: 0,
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (profileError) throw profileError

      // Log successful registration
      await auditLogger.log({
        action: "USER_REGISTERED",
        userId: userProfile.id.toString(),
        ipAddress: userData.ipAddress,
        userAgent: userData.userAgent,
        metadata: {
          email: userData.email,
          username: userData.username,
        },
      })

      return {
        success: true,
        user: {
          id: userProfile.id,
          email: userProfile.email,
          username: userProfile.username,
          tier: userProfile.tier,
        },
      }
    } catch (error) {
      // Log failed registration attempt
      await auditLogger.log({
        action: "REGISTRATION_FAILED",
        ipAddress: userData.ipAddress,
        userAgent: userData.userAgent,
        metadata: {
          email: userData.email,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })

      throw error
    }
  }

  // Secure login with brute force protection
  async loginUser(credentials: {
    email: string
    password: string
    ipAddress: string
    userAgent: string
    deviceInfo?: any
  }) {
    try {
      // Rate limiting
      await rateLimit.checkLimit(`login:${credentials.ipAddress}`, 10, 900) // 10 attempts per 15 minutes
      await rateLimit.checkLimit(`login:${credentials.email}`, 5, 900) // 5 attempts per email per 15 minutes

      // Input validation
      const validationResult = validateInput.credentials(credentials)
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(", ")}`)
      }

      // Check for account lockout
      await this.checkAccountLockout(credentials.email, credentials.ipAddress)

      // Authenticate with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (authError) {
        await this.recordFailedLogin(credentials)
        throw new Error("Invalid credentials")
      }

      // Get user profile
      const { data: userProfile, error: profileError } = await this.supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", authData.user.id)
        .single()

      if (profileError || !userProfile) {
        throw new Error("User profile not found")
      }

      // Check if account is active
      if (!userProfile.is_active || userProfile.is_banned) {
        throw new Error("Account is inactive or banned")
      }

      // Create session
      const session = await this.createSession({
        userId: userProfile.id.toString(),
        ipAddress: credentials.ipAddress,
        userAgent: credentials.userAgent,
        deviceInfo: credentials.deviceInfo,
      })

      // Generate tokens
      const accessToken = this.generateAccessToken(userProfile, session.sessionId)
      const refreshToken = this.generateRefreshToken(userProfile.id.toString(), session.sessionId)

      // Update last login
      await this.supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          login_count: userProfile.login_count + 1,
        })
        .eq("id", userProfile.id)

      // Log successful login
      await auditLogger.log({
        action: "USER_LOGIN",
        userId: userProfile.id.toString(),
        ipAddress: credentials.ipAddress,
        userAgent: credentials.userAgent,
        metadata: {
          sessionId: session.sessionId,
          deviceInfo: credentials.deviceInfo,
        },
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
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: this.config.jwtExpiresIn,
        },
        session: {
          sessionId: session.sessionId,
          expiresAt: session.expiresAt,
        },
      }
    } catch (error) {
      throw error
    }
  }

  // Secure session management
  private async createSession(sessionData: {
    userId: string
    ipAddress: string
    userAgent: string
    deviceInfo?: any
  }): Promise<UserSession> {
    const sessionId = this.generateSessionId()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const { data: session, error } = await this.supabase
      .from("user_sessions")
      .insert({
        user_id: Number.parseInt(sessionData.userId),
        session_token: sessionId,
        device_info: sessionData.deviceInfo || {},
        ip_address: sessionData.ipAddress,
        user_agent: sessionData.userAgent,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return {
      userId: sessionData.userId,
      sessionId,
      deviceInfo: sessionData.deviceInfo,
      ipAddress: sessionData.ipAddress,
      expiresAt,
      isActive: true,
    }
  }

  // JWT token generation with proper claims
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

    return jwt.sign(payload, this.config.jwtSecret, {
      algorithm: "HS256",
      issuer: "erigga-platform",
      audience: "erigga-users",
    })
  }

  private generateRefreshToken(userId: string, sessionId: string): string {
    const payload = {
      sub: userId,
      sessionId,
      type: "refresh",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    }

    return jwt.sign(payload, this.config.jwtSecret, {
      algorithm: "HS256",
      issuer: "erigga-platform",
      audience: "erigga-users",
    })
  }

  // Token validation and verification
  async verifyAccessToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        algorithms: ["HS256"],
        issuer: "erigga-platform",
        audience: "erigga-users",
      }) as any

      // Check if session is still active
      const { data: session } = await this.supabase
        .from("user_sessions")
        .select("*")
        .eq("session_token", decoded.sessionId)
        .eq("is_active", true)
        .single()

      if (!session || new Date(session.expires_at) < new Date()) {
        throw new Error("Session expired or invalid")
      }

      // Update last activity
      await this.supabase
        .from("user_sessions")
        .update({ last_activity: new Date().toISOString() })
        .eq("session_token", decoded.sessionId)

      return decoded
    } catch (error) {
      throw new Error("Invalid or expired token")
    }
  }

  // Secure logout with session cleanup
  async logout(sessionId: string, userId: string, ipAddress: string) {
    try {
      // Deactivate session
      await this.supabase
        .from("user_sessions")
        .update({ is_active: false })
        .eq("session_token", sessionId)
        .eq("user_id", Number.parseInt(userId))

      // Log logout
      await auditLogger.log({
        action: "USER_LOGOUT",
        userId,
        ipAddress,
        metadata: { sessionId },
      })

      return { success: true }
    } catch (error) {
      throw error
    }
  }

  // Account lockout protection
  private async checkAccountLockout(email: string, ipAddress: string) {
    const now = new Date()
    const lockoutThreshold = new Date(now.getTime() - this.config.lockoutDuration)

    // Check failed attempts for this email
    const { data: emailAttempts } = await this.supabase
      .from("audit_logs")
      .select("*")
      .eq("action", "LOGIN_FAILED")
      .gte("created_at", lockoutThreshold.toISOString())
      .contains("metadata", { email })

    if (emailAttempts && emailAttempts.length >= this.config.maxLoginAttempts) {
      throw new Error("Account temporarily locked due to too many failed login attempts")
    }

    // Check failed attempts for this IP
    const { data: ipAttempts } = await this.supabase
      .from("audit_logs")
      .select("*")
      .eq("action", "LOGIN_FAILED")
      .eq("ip_address", ipAddress)
      .gte("created_at", lockoutThreshold.toISOString())

    if (ipAttempts && ipAttempts.length >= this.config.maxLoginAttempts * 2) {
      throw new Error("IP address temporarily blocked due to suspicious activity")
    }
  }

  private async recordFailedLogin(credentials: {
    email: string
    ipAddress: string
    userAgent: string
  }) {
    await auditLogger.log({
      action: "LOGIN_FAILED",
      ipAddress: credentials.ipAddress,
      userAgent: credentials.userAgent,
      metadata: {
        email: credentials.email,
        timestamp: new Date().toISOString(),
      },
    })
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
  }
}

export const authService = new AuthService()
