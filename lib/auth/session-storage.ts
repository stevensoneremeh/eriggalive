interface StoredSession {
  sessionToken: string
  refreshToken: string
  expiresAt: string
  rememberMe: boolean
  user: any
}

export class SessionStorage {
  private static readonly SESSION_KEY = "erigga_session"

  static storeSession(session: StoredSession): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session))
    } catch (error) {
      console.error("Failed to store session:", error)
    }
  }

  static getStoredSession(): StoredSession | null {
    if (typeof window === "undefined") return null

    try {
      const stored = localStorage.getItem(this.SESSION_KEY)
      if (!stored) return null

      const session = JSON.parse(stored) as StoredSession

      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        this.clearSession()
        return null
      }

      return session
    } catch (error) {
      console.error("Failed to get stored session:", error)
      this.clearSession()
      return null
    }
  }

  static clearSession(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(this.SESSION_KEY)
    } catch (error) {
      console.error("Failed to clear session:", error)
    }
  }

  static updateSession(updates: Partial<StoredSession>): void {
    const current = this.getStoredSession()
    if (current) {
      this.storeSession({ ...current, ...updates })
    }
  }
}
