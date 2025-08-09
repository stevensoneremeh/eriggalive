import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from '@/lib/supabase/middleware'

// Define admin-only paths that require authentication
const ADMIN_PATHS = [
  "/admin",
]

// Define user-specific paths that require authentication
const AUTH_REQUIRED_PATHS = [
  "/dashboard",
  "/settings",
]

// Define paths that should always be accessible
const ALWAYS_ACCESSIBLE = [
  "/api",
  "/_next",
  "/favicon.ico",
  "/images",
  "/videos",
  "/fonts",
  "/placeholder",
  "/erigga",
  "/manifest.json",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all static assets and API routes
  if (ALWAYS_ACCESSIBLE.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Update session for all requests
  const response = await updateSession(request)

  // Check if this is an admin path
  if (ADMIN_PATHS.some(path => pathname.startsWith(path))) {
    // For admin paths, we need to check authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Check if this is a user-specific path that requires authentication
  if (AUTH_REQUIRED_PATHS.some(path => pathname.startsWith(path))) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // For all other paths, allow access but maintain session
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api|images|videos|fonts|placeholder|erigga|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
