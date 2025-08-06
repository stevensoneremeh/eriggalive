import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

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
  const { pathname } = request.nextUrl

  // Skip middleware for always accessible paths and static files
  if (
    ALWAYS_ACCESSIBLE.some((path) => pathname.startsWith(path)) ||
    pathname.includes(".") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next()
  }

  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Check if path requires authentication
  const requiresAuth = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Validate Supabase environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables')
    return handleAuthError(request, 'Configuration Error')
  }

  try {
    // Create Supabase client with request-specific configuration
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: request.headers.get('authorization') || ''
          }
        }
      }
    )

    // Extract session tokens
    const accessToken =
      request.cookies.get('sb-access-token')?.value ||
      request.cookies.get('supabase-auth-token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    const refreshToken =
      request.cookies.get('sb-refresh-token')?.value ||
      request.cookies.get('supabase-refresh-token')?.value

    // If no tokens and path requires auth, redirect to login
    if ((!accessToken || !refreshToken) && requiresAuth) {
      return redirectToLogin(request, pathname)
    }

    // If tokens exist, attempt to set session
    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      // Handle session setting errors
      if (error) {
        console.warn('Session setting error:', error.message)
        
        // If session cannot be set and path requires auth, redirect to login
        if (requiresAuth) {
          return redirectToLogin(request, pathname)
        }
      }
    }

    // Get user information
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    // Handle user retrieval errors
    if (userError) {
      console.warn('User retrieval error:', userError.message)
      
      // If path requires auth and no user, redirect to login
      if (requiresAuth) {
        return redirectToLogin(request, pathname)
      }
    }

    // If user exists and trying to access auth pages, redirect to dashboard
    if (user && (pathname === "/login" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // If no user and path requires auth, redirect to login
    if (!user && requiresAuth) {
      return redirectToLogin(request, pathname)
    }

  } catch (error) {
    console.error("Middleware authentication error:", error)
    
    // If an unexpected error occurs and path requires auth, handle auth error
    if (requiresAuth) {
      return handleAuthError(request, 'Unexpected Error')
    }
  }

  return NextResponse.next()
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
    "/((?!api/|_next/static|_next/image|favicon.ico|images/|videos/|fonts/|placeholder|.*\\.).*)"],
}
