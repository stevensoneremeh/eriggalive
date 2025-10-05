<<<<<<< HEAD
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Skip middleware if Supabase is not configured
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("⚠️ Supabase not configured, skipping middleware")
      return supabaseResponse
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    // Refresh session if expired
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Define protected routes
    const protectedRoutes = [
      "/dashboard",
      "/profile",
      "/settings",
      "/community",
      "/coins",
      "/vault",
      "/premium",
      "/admin",
    ]
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

    // If accessing a protected route without authentication, redirect to login
    if (isProtectedRoute && (!user || error)) {
      console.log("🔒 Protected route accessed without auth, redirecting to login")
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If authenticated and accessing auth pages, redirect to dashboard
    if (user && !error && ["/login", "/signup", "/auth/signin", "/auth/signup"].includes(pathname)) {
      console.log("✅ Authenticated user accessing auth page, redirecting to dashboard")
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return supabaseResponse
  } catch (error) {
    console.error("❌ Middleware error:", error)
    // Don't block requests on middleware errors
    return supabaseResponse
=======
import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  try {
    const response = await updateSession(request)
    return response
  } catch (error: any) {
    console.error("[SERVER] Middleware execution failed:", error.message)
    return NextResponse.next()
>>>>>>> new
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
<<<<<<< HEAD
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
=======
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
>>>>>>> new
  ],
}
