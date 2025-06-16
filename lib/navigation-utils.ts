"use client"

// Define route constants
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
]

// Define public routes that don't require authentication
export const PUBLIC_ROUTES = [ROUTES.HOME, ROUTES.LOGIN, ROUTES.SIGNUP]

// Define auth routes that authenticated users shouldn't access
export const AUTH_ROUTES = [ROUTES.LOGIN, ROUTES.SIGNUP]

export interface NavigationOptions {
  replace?: boolean
  preserveQuery?: boolean
  fallback?: string
}

// Simple utility functions that don't use hooks
export function isValidRedirectPath(path: string): boolean {
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

export function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
}

export function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
}

// Client-side storage utilities
export function storeRedirectPath(path: string): void {
  if (typeof window === "undefined" || !isValidRedirectPath(path)) return

  try {
    localStorage.setItem("erigga_redirect_path", path)
    sessionStorage.setItem("erigga_redirect_path", path)
  } catch (error) {
    console.warn("Failed to store redirect path:", error)
  }
}

export function getStoredRedirectPath(): string {
  if (typeof window === "undefined") return ROUTES.DASHBOARD

  try {
    return (
      localStorage.getItem("erigga_redirect_path") || sessionStorage.getItem("erigga_redirect_path") || ROUTES.DASHBOARD
    )
  } catch {
    return ROUTES.DASHBOARD
  }
}

export function clearStoredRedirectPath(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem("erigga_redirect_path")
    sessionStorage.removeItem("erigga_redirect_path")
  } catch (error) {
    console.warn("Failed to clear redirect path:", error)
  }
}

// Utility function to get redirect path from URL params or storage
export function getRedirectPath(searchParams?: URLSearchParams | null): string {
  // Try URL params first
  if (searchParams?.has("redirect")) {
    const redirectParam = searchParams.get("redirect")
    if (redirectParam && isValidRedirectPath(redirectParam)) {
      return redirectParam
    }
  }

  // Try stored paths
  return getStoredRedirectPath()
}
