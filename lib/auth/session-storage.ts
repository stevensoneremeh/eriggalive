interface StoredSession {
  sessionToken: string
  refreshToken: string
  expiresAt: string
  rememberMe: boolean
  user: any
  fingerprint?: string
}

export class SessionStorage {
  private static readonly SESSION_KEY = "erigga_session"
  private static readonly TEMP_SESSION_KEY = "erigga_temp_session"

  static saveSession(session: StoredSession): void {
    try {
      const sessionData = {
        ...session,
        fingerprint: this.generateFingerprint(),
        savedAt: new Date().toISOString(),
      }

      const storage = session.rememberMe ? localStorage : sessionStorage
      storage.setItem(this.SESSION_KEY, JSON.stringify(sessionData))

      // Also save to temporary storage for cross-tab communication
      sessionStorage.setItem(this.TEMP_SESSION_KEY, JSON.stringify(sessionData))
    } catch (error) {
      console.error("Failed to save session:", error)
    }
  }

  static getSession(): StoredSession | null {
    try {
      // Try localStorage first (for remembered sessions)
      let sessionData = localStorage.getItem(this.SESSION_KEY)

      // If not found, try sessionStorage
      if (!sessionData) {
        sessionData = sessionStorage.getItem(this.SESSION_KEY)
      }

      // If still not found, try temporary storage
      if (!sessionData) {
        sessionData = sessionStorage.getItem(this.TEMP_SESSION_KEY)
      }

      if (!sessionData) return null

      const session: StoredSession & { fingerprint?: string; savedAt?: string } = JSON.parse(sessionData)

      // Validate session integrity
      if (!this.validateSession(session)) {
        this.clearSession()
        return null
      }

      // Check expiration
      if (new Date(session.expiresAt) < new Date()) {
        this.clearSession()
        return null
      }

      return session
    } catch (error) {
      console.error("Failed to get session:", error)
      this.clearSession()
      return null
    }
  }

  static updateSession(updates: Partial<StoredSession>): void {
    const currentSession = this.getSession()
    if (currentSession) {
      this.saveSession({ ...currentSession, ...updates })
    }
  }

  static clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY)
      sessionStorage.removeItem(this.SESSION_KEY)
      sessionStorage.removeItem(this.TEMP_SESSION_KEY)
    } catch (error) {
      console.error("Failed to clear session:", error)
    }
  }

  static isSessionValid(): boolean {
    const session = this.getSession()
    return session !== null
  }

  private static validateSession(session: any): boolean {
    const requiredFields = ["sessionToken", "refreshToken", "expiresAt", "user"]
    return requiredFields.every((field) => session[field] !== undefined)
  }

  private static generateFingerprint(): string {
    if (typeof window === "undefined") return "server"

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
    ]

    let hash = 0
    const str = components.join("|")
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36)
  }
}
