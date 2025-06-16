"use client"

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { useRouter, usePathname } from "next/navigation"

// Define route constants - EXPORTED
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  COMMUNITY: "/community",
  VAULT: "/vault",
  TICKETS: "/tickets",
  PREMIUM: "/premium",
  MERCH: "/merch",
  COINS: "/coins",
  ADMIN: "/admin",
  CHRONICLES: "/chronicles",
} as const

// Define protected routes that require authentication
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.COMMUNITY,
  ROUTES.VAULT,
  ROUTES.TICKETS,
  ROUTES.PREMIUM,
  ROUTES.MERCH,
  ROUTES.COINS,
  ROUTES.ADMIN,
  ROUTES.CHRONICLES,
]

// Define public routes that don't require authentication
export const PUBLIC_ROUTES = [ROUTES.HOME, ROUTES.LOGIN, ROUTES.SIGNUP]

// Define auth routes that authenticated users shouldn't access
export const AUTH_ROUTES = [ROUTES.LOGIN, ROUTES.SIGNUP]

// Storage keys for consistent access
export const STORAGE_KEYS = {
  REDIRECT_PATH: "erigga_redirect_path",
  USER_PREFERENCES: "erigga_user_preferences",
} as const

export const DEFAULT_REDIRECT_PATH = ROUTES.DASHBOARD

export interface NavigationOptions {
  replace?: boolean
  preserveQuery?: boolean
  fallback?: string
}

export class NavigationManager {
  private router: AppRouterInstance
  private currentPath: string
  private isClient: boolean

  constructor(router: AppRouterInstance, currentPath: string) {
    this.router = router
    this.currentPath = currentPath
    this.isClient = typeof window !== "undefined"
  }

  // Navigate to a specific route with options
  navigateTo(path: string, options: NavigationOptions = {}) {
    const { replace = false, preserveQuery = false, fallback = ROUTES.DASHBOARD } = options

    try {
      // Validate the path
      if (!path || typeof path !== "string") {
        console.warn("Invalid navigation path, using fallback:", fallback)
        path = fallback
      }

      // Preserve query parameters if requested
      if (preserveQuery && this.isClient) {
        const currentUrl = new URL(window.location.href)
        const targetUrl = new URL(path, window.location.origin)

        // Copy search params from current URL to target URL
        currentUrl.searchParams.forEach((value, key) => {
          if (!targetUrl.searchParams.has(key)) {
            targetUrl.searchParams.set(key, value)
          }
        })

        path = targetUrl.pathname + targetUrl.search
      }

      // Perform navigation
      if (replace) {
        this.router.replace(path)
      } else {
        this.router.push(path)
      }

      return true
    } catch (error) {
      console.error("Navigation error:", error)

      // Fallback navigation
      try {
        this.router.push(fallback)
        return true
      } catch (fallbackError) {
        console.error("Fallback navigation failed:", fallbackError)
        return false
      }
    }
  }

  // Handle post-login navigation
  handlePostLoginNavigation(intendedPath?: string | null) {
    // Priority order for post-login navigation:
    // 1. Intended path from URL params
    // 2. Stored redirect path from storage
    // 3. Default dashboard

    let targetPath = ROUTES.DASHBOARD

    // Check for intended path from URL
    if (intendedPath && this.isValidRedirectPath(intendedPath)) {
      targetPath = intendedPath
    } else {
      // Check for stored redirect path
      const storedPath = this.getStoredRedirectPath()
      if (storedPath && this.isValidRedirectPath(storedPath)) {
        targetPath = storedPath
      }
    }

    // Clear any stored redirect paths
    this.clearStoredRedirectPath()

    // Navigate to the target path
    return this.navigateTo(targetPath, { replace: true })
  }

  // Handle authentication-required navigation
  handleAuthRequiredNavigation(currentPath: string) {
    // Store the current path for post-login redirect
    this.storeRedirectPath(currentPath)

    // Navigate to login with redirect parameter
    const loginUrl = `${ROUTES.LOGIN}?redirect=${encodeURIComponent(currentPath)}`
    return this.navigateTo(loginUrl, { replace: true })
  }

  // Check if a path is valid for redirection
  private isValidRedirectPath(path: string): boolean {
    try {
      // Must be a string and start with /
      if (!path || typeof path !== "string" || !path.startsWith("/")) {
        return false
      }

      // Must be a protected route (we don't redirect to public routes after login)
      return PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
    } catch {
      return false
    }
  }

  // Store redirect path for post-login navigation
  private storeRedirectPath(path: string) {
    if (!this.isClient) return

    try {
      // Store in both localStorage and sessionStorage for redundancy
      localStorage.setItem(STORAGE_KEYS.REDIRECT_PATH, path)
      sessionStorage.setItem(STORAGE_KEYS.REDIRECT_PATH, path)

      // Also store in a cookie as backup (handled by middleware)
      document.cookie = `${STORAGE_KEYS.REDIRECT_PATH}=${encodeURIComponent(path)}; path=/; max-age=300; SameSite=Lax`
    } catch (error) {
      console.warn("Failed to store redirect path:", error)
    }
  }

  // Get stored redirect path
  private getStoredRedirectPath(): string | null {
    if (!this.isClient) return null

    try {
      // Try localStorage first, then sessionStorage
      return (
        localStorage.getItem(STORAGE_KEYS.REDIRECT_PATH) || sessionStorage.getItem(STORAGE_KEYS.REDIRECT_PATH) || null
      )
    } catch {
      return null
    }
  }

  // Clear stored redirect paths
  private clearStoredRedirectPath() {
    if (!this.isClient) return

    try {
      localStorage.removeItem(STORAGE_KEYS.REDIRECT_PATH)
      sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_PATH)

      // Clear cookie
      document.cookie = `${STORAGE_KEYS.REDIRECT_PATH}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    } catch (error) {
      console.warn("Failed to clear redirect path:", error)
    }
  }

  // Check if current path requires authentication
  isProtectedRoute(path: string = this.currentPath): boolean {
    return PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
  }

  // Check if current path is an auth route
  isAuthRoute(path: string = this.currentPath): boolean {
    return AUTH_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
  }

  // Safe execution wrapper for client-side operations
  private safeExecute<T>(clientFn: () => T, fallback: T): T {
    if (!this.isClient) {
      return fallback
    }
    try {
      return clientFn()
    } catch (error) {
      console.warn("NavigationManager operation failed:", error)
      return fallback
    }
  }
}

// Hook to use navigation manager
export function useNavigationManager() {
  const router = useRouter()
  const pathname = usePathname()

  if (!router || !pathname) {
    return null
  }

  return new NavigationManager(router as AppRouterInstance, pathname)
}

// Utility function to get redirect path from URL or storage - EXPORTED
export function getRedirectPath(searchParams?: URLSearchParams): string {
  // Try URL params first
  if (searchParams?.has("redirect")) {
    const redirectParam = searchParams.get("redirect")
    if (redirectParam && redirectParam.startsWith("/")) {
      return redirectParam
    }
  }

  // Try stored paths (only on client side)
  if (typeof window !== "undefined") {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEYS.REDIRECT_PATH) || sessionStorage.getItem(STORAGE_KEYS.REDIRECT_PATH)
      if (stored && stored.startsWith("/")) {
        return stored
      }
    } catch {
      // Ignore storage errors
    }
  }

  return DEFAULT_REDIRECT_PATH
}

// Utility function to check if a path is protected - EXPORTED
export function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
}

// Utility function to check if a path is an auth route - EXPORTED
export function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
}

// Utility function to validate redirect paths - EXPORTED
export function isValidRedirectPath(path: string): boolean {
  try {
    // Must be a string and start with /
    if (!path || typeof path !== "string" || !path.startsWith("/")) {
      return false
    }

    // Check for potentially harmful characters
    if (/[<>{}|\\^`;]/.test(path)) {
      return false
    }

    // Must be a protected route (we don't redirect to public routes after login)
    return PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
  } catch {
    return false
  }
}

// Utility function to store redirect path - EXPORTED
export function storeRedirectPath(path: string): void {
  if (typeof window === "undefined" || !isValidRedirectPath(path)) return

  try {
    localStorage.setItem(STORAGE_KEYS.REDIRECT_PATH, path)
    sessionStorage.setItem(STORAGE_KEYS.REDIRECT_PATH, path)
  } catch (error) {
    console.warn("Failed to store redirect path:", error)
  }
}

// Utility function to clear redirect path - EXPORTED
export function clearRedirectPath(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(STORAGE_KEYS.REDIRECT_PATH)
    sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_PATH)
  } catch (error) {
    console.warn("Failed to clear redirect path:", error)
  }
}

// Type exports for better TypeScript support
export type RouteKey = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteKey]
