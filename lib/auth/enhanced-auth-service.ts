import { createClient } from "@supabase/supabase-js"

interface DeviceInfo {
  userAgent: string
  platform: string
  browser: string
  os: string
  isMobile: boolean
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

export class EnhancedAuthService {
  private supabase: any

  constructor() {
    // Initialize Supabase client with proper error handling
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseAnonKey) {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey)
      } else {
        console.warn("Supabase credentials not found, using demo mode")
        this.supabase = this.createDemoClient()
      }
    } catch (error) {
      console.error("Failed to initialize Supabase:", error)
      this.supabase = this.createDemoClient()
    }
  }

  private createDemoClient() {
    return {
      auth: {
        signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
          // Demo authentication - accept specific test credentials
          const validCredentials = [
            { email: "admin@erigga.com", password: "admin123", tier: "admin" },
            { email: "user@erigga.com", password: "user123", tier: "grassroot" },
            { email: "demo@erigga.com", password: "demo123", tier: "pioneer" },
          ]

          const user = validCredentials.find((cred) => cred.email === email && cred.password === password)

          if (user) {
            return {
              data: {
                user: {
                  id: `demo-${Date.now()}`,
                  email: user.email,
                  created_at: new Date().toISOString(),
                },
                session: {
                  access_token: `demo-token-${Date.now()}`,
                  refresh_token: `demo-refresh-${Date.now()}`,
                  expires_in: 3600,
                },
              },
              error: null,
            }
          }

          return {
            data: { user: null, session: null },
            error: { message: "Invalid login credentials" },
          }
        },
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }
  }

  async login(credentials: {
    email: string
    password: string
    rememberMe?: boolean
    deviceInfo?: DeviceInfo
    ipAddress?: string
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
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        console.error("Auth error:", error)
        return {
          success: false,
          error: this.getAuthErrorMessage(error.message),
        }
      }

      if (!data.user) {
        return { success: false, error: "Authentication failed" }
      }

      // Create user profile based on email for demo
      const userProfile = this.createUserProfile(data.user, credentials.email)

      return {
        success: true,
        user: userProfile,
        tokens: {
          accessToken: data.session?.access_token || `token-${Date.now()}`,
          refreshToken: data.session?.refresh_token || `refresh-${Date.now()}`,
          expiresIn: data.session?.expires_in ? data.session.expires_in * 1000 : 3600000,
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

  private createUserProfile(authUser: any, email: string) {
    // Determine tier based on email for demo
    let tier = "grassroot"
    let coins = 100
    let level = 1
    let points = 50

    if (email.includes("admin")) {
      tier = "admin"
      coins = 10000
      level = 10
      points = 5000
    } else if (email.includes("pioneer")) {
      tier = "pioneer"
      coins = 1000
      level = 5
      points = 500
    } else if (email.includes("elder")) {
      tier = "elder"
      coins = 5000
      level = 8
      points = 2000
    }

    return {
      id: authUser.id,
      email: authUser.email,
      username: email.split("@")[0],
      fullName: `${email.split("@")[0].charAt(0).toUpperCase()}${email.split("@")[0].slice(1)} User`,
      tier,
      coins,
      level,
      points,
      avatarUrl: null,
      isActive: true,
    }
  }

  async validateToken(token: string): Promise<AuthResult> {
    try {
      // For demo mode, validate demo tokens
      if (token.startsWith("demo-token") || token.startsWith("token-")) {
        return {
          success: true,
          user: {
            id: "demo-user",
            email: "demo@erigga.com",
            username: "demouser",
            fullName: "Demo User",
            tier: "grassroot",
            coins: 500,
            level: 1,
            points: 100,
            avatarUrl: null,
            isActive: true,
          },
        }
      }

      // Try to get session from Supabase
      const { data, error } = await this.supabase.auth.getSession()

      if (error || !data.session) {
        return { success: false, error: "Invalid token" }
      }

      const userProfile = this.createUserProfile(data.session.user, data.session.user.email)

      return {
        success: true,
        user: userProfile,
      }
    } catch (error) {
      console.error("Token validation error:", error)
      return { success: false, error: "Token validation failed" }
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // For demo mode
      if (refreshToken.startsWith("demo-refresh") || refreshToken.startsWith("refresh-")) {
        return {
          success: true,
          tokens: {
            accessToken: `token-${Date.now()}`,
            refreshToken: `refresh-${Date.now()}`,
            expiresIn: 3600000,
          },
        }
      }

      // Try Supabase refresh
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      })

      if (error || !data.session) {
        return { success: false, error: "Token refresh failed" }
      }

      return {
        success: true,
        tokens: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in * 1000,
        },
      }
    } catch (error) {
      console.error("Token refresh error:", error)
      return { success: false, error: "Token refresh failed" }
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.supabase.auth.signOut()
      return { success: true }
    } catch (error) {
      console.error("Logout error:", error)
      return { success: false, error: "Logout failed" }
    }
  }

  private getAuthErrorMessage(error: string): string {
    const errorMap: Record<string, string> = {
      "Invalid login credentials": "Invalid email or password",
      "Email not confirmed": "Please verify your email address",
      "Too many requests": "Too many login attempts. Please try again later",
      "User not found": "No account found with this email",
    }

    return errorMap[error] || error || "Authentication failed"
  }
}

export const enhancedAuthService = new EnhancedAuthService()
