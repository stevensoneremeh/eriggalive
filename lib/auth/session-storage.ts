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
    try {
      const sessionData = JSON.stringify(session)

      if (session.rememberMe) {
        // Use localStorage for persistent sessions
        localStorage.setItem(this.SESSION_KEY, sessionData)
        // Also store in sessionStorage as backup
        sessionStorage.setItem(this.TEMP_SESSION_KEY, sessionData)
      } else {
        // Use sessionStorage for temporary sessions
        sessionStorage.setItem(this.TEMP_SESSION_KEY, sessionData)
        // Clear any persistent session
        localStorage.removeItem(this.SESSION_KEY)
      }
    } catch (error) {
      console.error("Error saving session:", error)
    }
  }

  static getSession(): StoredSession | null {
    try {
      // First check sessionStorage (current session)
      let sessionData = sessionStorage.getItem(this.TEMP_SESSION_KEY)

      // If not found, check localStorage (persistent session)
      if (!sessionData) {
        sessionData = localStorage.getItem(this.SESSION_KEY)
      }

      if (!sessionData) {
        return null
      }

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

  static updateSession(updates: Partial<StoredSession>): void {
    try {
      const currentSession = this.getSession()
      if (!currentSession) return

      const updatedSession = { ...currentSession, ...updates }
      this.saveSession(updatedSession)
    } catch (error) {
      console.error("Error updating session:", error)
    }
  }

  static clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY)
      sessionStorage.removeItem(this.TEMP_SESSION_KEY)
    } catch (error) {
      console.error("Error clearing session:", error)
    }
  }

  static isSessionValid(): boolean {
    const session = this.getSession()
    return session !== null && new Date(session.expiresAt) > new Date()
  }
}
