interface StoredSession {
  sessionToken: string
  refreshToken: string
  expiresAt: string
  rememberMe: boolean
  user: any
}

export class SessionStorage {
  private static readonly SESSION_KEY = "erigga_session"
  private static readonly TEMP_SESSION_KEY = "erigga_temp_session"

  static saveSession(session: StoredSession): void {
    if (typeof window === "undefined") return

    try {
      const sessionData = JSON.stringify(session)

      if (session.rememberMe) {
        // Persistent storage for "Remember Me"
        localStorage.setItem(this.SESSION_KEY, sessionData)
      } else {
        // Session storage for temporary sessions
        sessionStorage.setItem(this.TEMP_SESSION_KEY, sessionData)
      }
    } catch (error) {
      console.error("Error saving session:", error)
    }
  }

  static getSession(): StoredSession | null {
    if (typeof window === "undefined") return null

    try {
      // Check persistent storage first
      let sessionData = localStorage.getItem(this.SESSION_KEY)

      // If not found, check session storage
      if (!sessionData) {
        sessionData = sessionStorage.getItem(this.TEMP_SESSION_KEY)
      }

      if (!sessionData) return null

      const session = JSON.parse(sessionData) as StoredSession

      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        this.clearSession()
        return null
      }

      return session
    } catch (error) {
      console.error("Error getting session:", error)
      this.clearSession()
      return null
    }
  }

  static clearSession(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(this.SESSION_KEY)
      sessionStorage.removeItem(this.TEMP_SESSION_KEY)
    } catch (error) {
      console.error("Error clearing session:", error)
    }
  }

  static updateSession(updates: Partial<StoredSession>): void {
    const currentSession = this.getSession()
    if (!currentSession) return

    const updatedSession = { ...currentSession, ...updates }
    this.saveSession(updatedSession)
  }
}
