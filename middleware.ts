import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase environment variables not found")
      return response
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    })

    // Get user with timeout
    let user = null
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 3000))

      const authPromise = supabase.auth.getUser()

      const {
        data: { user: authUser },
      } = (await Promise.race([authPromise, timeoutPromise])) as any
      user = authUser
    } catch (error) {
      console.warn("Auth check failed in middleware:", error)
      // Continue without user authentication
    }

    // Protected routes that require authentication
    const protectedRoutes = ["/dashboard", "/chat", "/coins", "/settings", "/profile", "/rooms", "/admin"]

    // Auth routes that should redirect if already logged in
    const authRoutes = ["/login", "/signup"]

    // Check if current path is protected
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

    // Redirect unauthenticated users from protected routes to login
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users from auth routes to dashboard
    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // Return the original response if middleware fails
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}
