interface StoredSession {
  sessionToken: string
  refreshToken: string
  expiresAt: string
  rememberMe: boolean
  user: {
    id: string
    email: string
    username: string
    fullName: string
    tier: string
    coins: number
    level: number
    points: number
    avatarUrl?: string
  }
}

export class SessionStorage {
  private static readonly SESSION_KEY = "erigga_session"
  private static readonly REMEMBER_KEY = "erigga_remember"

  /**
   * Store session with persistence option
   */
  static storeSession(session: StoredSession): void {
    try {
      const sessionData = JSON.stringify(session)

      if (session.rememberMe) {
        // Use localStorage for persistent sessions
        localStorage.setItem(this.SESSION_KEY, sessionData)
        localStorage.setItem(this.REMEMBER_KEY, "true")
      } else {
        // Use sessionStorage for temporary sessions
        sessionStorage.setItem(this.SESSION_KEY, sessionData)
        localStorage.removeItem(this.REMEMBER_KEY)
      }
    } catch (error) {
      console.error("Error storing session:", error)
    }
  }

  /**
   * Retrieve stored session
   */
  static getStoredSession(): StoredSession | null {
    try {
      // Check if user chose to be remembered
      const rememberMe = localStorage.getItem(this.REMEMBER_KEY) === "true"

      // Get session from appropriate storage
      const sessionData = rememberMe ? localStorage.getItem(this.SESSION_KEY) : sessionStorage.getItem(this.SESSION_KEY)

      if (!sessionData) {
        return null
      }

      const session: StoredSession = JSON.parse(sessionData)

      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        this.clearSession()
        return null
      }

      return session
    } catch (error) {
      console.error("Error retrieving session:", error)
      this.clearSession()
      return null
    }
  }

  /**
   * Clear stored session
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY)
      localStorage.removeItem(this.REMEMBER_KEY)
      sessionStorage.removeItem(this.SESSION_KEY)
    } catch (error) {
      console.error("Error clearing session:", error)
    }
  }

  /**
   * Update session expiry
   */
  static updateSessionExpiry(expiresAt: string): void {
    try {
      const session = this.getStoredSession()
      if (session) {
        session.expiresAt = expiresAt
        this.storeSession(session)
      }
    } catch (error) {
      console.error("Error updating session expiry:", error)
    }
  }

  /**
   * Check if session exists and is valid
   */
  static hasValidSession(): boolean {
    const session = this.getStoredSession()
    return session !== null && new Date(session.expiresAt) > new Date()
  }
}
