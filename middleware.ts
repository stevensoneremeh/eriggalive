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

  // If it's a public path or doesn't require auth, allow access
  if (isPublicPath || !requiresAuth) {
    return NextResponse.next()
  }

  // For protected paths, check authentication
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not found, allowing access')
    return NextResponse.next()
  }

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: false,
      },
    })

    // Get the session token from cookies
    const sessionToken = request.cookies.get('sb-access-token')?.value || 
                        request.cookies.get('supabase-auth-token')?.value ||
                        request.headers.get('authorization')?.replace('Bearer ', '')

    if (sessionToken) {
      // Set the session for this request
      await supabase.auth.setSession({
        access_token: sessionToken,
        refresh_token: request.cookies.get('sb-refresh-token')?.value || ''
      })
    }

    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    // If there's an error getting the user, allow access (let client handle auth)
    if (error) {
      console.warn('Middleware auth error:', error.message)
      return NextResponse.next()
    }

    // If no user and path requires auth, redirect to login
    if (!user && requiresAuth) {
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user exists and trying to access auth pages, redirect to dashboard
    if (user && (pathname === "/login" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  } catch (error) {
    console.error("Middleware auth error:", error)
    // Continue without auth checks if there's an error - let client handle it
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|images/|videos/|fonts/|placeholder|.*\\.).*)"],
}
