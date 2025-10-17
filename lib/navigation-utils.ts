"use client"

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { useRouter, usePathname } from "next/navigation"

// Define route constants
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  VAULT: "/vault",
  TICKETS: "/tickets",
  PREMIUM: "/premium",
  MERCH: "/merch",
  COINS: "/coins",
  ADMIN: "/admin",
} as const

// Define protected routes that require authentication
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.VAULT,
  ROUTES.TICKETS,
  ROUTES.PREMIUM,
  ROUTES.MERCH,
  ROUTES.COINS,
  ROUTES.ADMIN,
  "/chronicles",
  "/settings",
  "/mission",
  "/meet-and-greet",
  "/profile",
  "/rooms",
  "/chat",
]

// Define public routes that don't require authentication
export const PUBLIC_ROUTES = [
  ROUTES.HOME, 
  ROUTES.LOGIN, 
  ROUTES.SIGNUP,
  "/forgot-password",
  "/reset-password",
  "/signup/success",
  "/terms",
  "/privacy",
  "/about",
  "/auth/callback",
  "/auth/auth-code-error",
]

// Define auth routes that authenticated users shouldn't access
export const AUTH_ROUTES = [ROUTES.LOGIN, ROUTES.SIGNUP]

export interface NavigationOptions {
  replace?: boolean
  preserveQuery?: boolean
  fallback?: string
}

export class NavigationManager {
  private router: AppRouterInstance
  private currentPath: string

  constructor(router: AppRouterInstance, currentPath: string) {
    this.router = router
    this.currentPath = currentPath
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
      if (preserveQuery && typeof window !== "undefined") {
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
    // 2. Stored redirect path from cookies/localStorage
    // 3. Default dashboard

    let targetPath: string = ROUTES.DASHBOARD

    // Check for intended path from URL
    if (intendedPath && this.isValidRedirectPath(intendedPath)) {
      targetPath = intendedPath
    } else {
      // Check for stored redirect path
      const storedPath = this.getStoredRedirectPath()
      if (storedPath && this.isValidRedirectPath(storedPath)) {
        targetPath = storedPath as string
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
    if (typeof window === "undefined") return

    try {
      // Store in both localStorage and sessionStorage for redundancy
      localStorage.setItem("erigga_redirect_path", path)
      sessionStorage.setItem("erigga_redirect_path", path)

      // Also store in a cookie as backup (handled by middleware)
      document.cookie = `erigga_redirect_path=${encodeURIComponent(path)}; path=/; max-age=300; SameSite=Lax`
    } catch (error) {
      console.warn("Failed to store redirect path:", error)
    }
  }

  // Get stored redirect path
  private getStoredRedirectPath(): string | null {
    if (typeof window === "undefined") return null

    try {
      // Try localStorage first, then sessionStorage
      return localStorage.getItem("erigga_redirect_path") || sessionStorage.getItem("erigga_redirect_path") || null
    } catch {
      return null
    }
  }

  // Clear stored redirect paths
  private clearStoredRedirectPath() {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem("erigga_redirect_path")
      sessionStorage.removeItem("erigga_redirect_path")

      // Clear cookie
      document.cookie = "erigga_redirect_path=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
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

  // Check if current path is public
  isPublicRoute(path: string = this.currentPath): boolean {
    return PUBLIC_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
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

// Utility function to get redirect path from URL or storage
export function getRedirectPath(searchParams?: URLSearchParams): string {
  // Try URL params first
  if (searchParams?.has("redirect")) {
    const redirectParam = searchParams.get("redirect")
    if (redirectParam && redirectParam.startsWith("/")) {
      return redirectParam
    }
  }

  // Try stored paths
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("erigga_redirect_path") || sessionStorage.getItem("erigga_redirect_path")
      if (stored && stored.startsWith("/")) {
        return stored
      }
    } catch {
      // Ignore storage errors
    }
  }

  return ROUTES.DASHBOARD
}

// Utility function to clear redirect paths
export function clearRedirectPaths() {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem("erigga_redirect_path")
    sessionStorage.removeItem("erigga_redirect_path")
    document.cookie = "erigga_redirect_path=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  } catch (error) {
    console.warn("Failed to clear redirect paths:", error)
  }
}
