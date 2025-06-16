interface DeviceInfo {
  userAgent: string
  platform: string
  browser: string
  os: string
  isMobile: boolean
  screenResolution?: string
  timezone?: string
  language?: string
}

export class DeviceDetection {
  static getDeviceInfo(): DeviceInfo {
    if (typeof window === "undefined") {
      return {
        userAgent: "Server",
        platform: "Server",
        browser: "Server",
        os: "Server",
        isMobile: false,
      }
    }

    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const language = navigator.language
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const screenResolution = `${screen.width}x${screen.height}`

    return {
      userAgent,
      platform,
      browser: this.getBrowser(userAgent),
      os: this.getOS(userAgent, platform),
      isMobile: this.isMobile(userAgent),
      screenResolution,
      timezone,
      language,
    }
  }

  static getClientIP(): string {
    // In production, this would be handled by the server
    // Client-side IP detection is not reliable
    return "client-detected"
  }

  private static getBrowser(userAgent: string): string {
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari"
    if (userAgent.includes("Edg")) return "Edge"
    if (userAgent.includes("Opera")) return "Opera"
    return "Unknown"
  }

  private static getOS(userAgent: string, platform: string): string {
    if (userAgent.includes("Windows")) return "Windows"
    if (userAgent.includes("Mac")) return "macOS"
    if (userAgent.includes("Linux")) return "Linux"
    if (userAgent.includes("Android")) return "Android"
    if (userAgent.includes("iOS") || platform.includes("iPhone") || platform.includes("iPad")) return "iOS"
    return "Unknown"
  }

  private static isMobile(userAgent: string): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  }

  static generateFingerprint(): string {
    if (typeof window === "undefined") return "server-fingerprint"

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.cookieEnabled,
    ]

    return btoa(components.join("|"))
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 32)
  }
}
