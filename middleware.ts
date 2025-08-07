import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from '@/lib/supabase/middleware'

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/signup/success",
  "/terms",
  "/privacy",
  "/about",
]

// Define paths that should always be accessible
const ALWAYS_ACCESSIBLE = ["/api", "/_next", "/favicon.ico", "/images", "/videos", "/fonts", "/placeholder", "/erigga"]

// Define protected paths
const PROTECTED_PATHS = [
  "/dashboard",
  "/community",
  "/chronicles",
  "/vault",
  "/tickets",
  "/premium",
  "/merch",
  "/coins",
  "/settings",
  "/admin",
  "/mission",
  "/meet-and-greet",
]

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

// Helper function to redirect to login with optional redirect path
function redirectToLogin(request: NextRequest, redirectPath: string) {
  const redirectUrl = new URL("/login", request.url)
  redirectUrl.searchParams.set("redirect", redirectPath)
  return NextResponse.redirect(redirectUrl)
}

// Helper function to handle authentication errors
function handleAuthError(request: NextRequest, errorType: string) {
  const errorUrl = new URL("/login", request.url)
  errorUrl.searchParams.set("error", errorType)
  return NextResponse.redirect(errorUrl)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
