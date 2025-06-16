interface DeviceInfo {
  userAgent: string
  platform: string
  browser: string
  os: string
  isMobile: boolean
}

export class DeviceDetection {
  static getDeviceInfo(): DeviceInfo {
    if (typeof window === "undefined") {
      // Server-side fallback
      return {
        userAgent: "Server",
        platform: "Server",
        browser: "Server",
        os: "Server",
        isMobile: false,
      }
    }

    const userAgent = navigator.userAgent || ""
    const platform = navigator.platform || ""

    return {
      userAgent,
      platform,
      browser: this.getBrowser(userAgent),
      os: this.getOS(userAgent, platform),
      isMobile: this.isMobile(userAgent),
    }
  }

  static getClientIP(): string {
    // This will be handled server-side in API routes
    return "client"
  }

  private static getBrowser(userAgent: string): string {
    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari")) return "Safari"
    if (userAgent.includes("Edge")) return "Edge"
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
}
