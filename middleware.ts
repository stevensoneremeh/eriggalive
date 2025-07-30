import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Define protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/vault",
  "/coins",
  "/merch",
  "/profile",
  "/meet-greet",
  "/admin",
  "/premium",
  "/tickets",
]

// Define auth routes that should redirect if already authenticated
const authRoutes = ["/login", "/signup"]

// Define public routes that don't require authentication
const publicRoutes = ["/", "/community", "/mission", "/radio"]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip middleware if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase not configured, skipping auth middleware")
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
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
      remove(name: string, options: CookieOptions) {
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

  try {
    // Refresh session if expired - required for Server Components
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Middleware auth error:", error)
      // Don't block the request on auth errors, let the client handle it
      return response
    }

    const { pathname } = request.nextUrl
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
    const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))

    // If user is not authenticated and trying to access protected route
    if (!session && isProtectedRoute) {
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is authenticated and trying to access auth routes, redirect to dashboard
    if (session && isAuthRoute) {
      const redirectTo = request.nextUrl.searchParams.get("redirect")
      const destination = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard"
      return NextResponse.redirect(new URL(destination, request.url))
    }

    // For all other routes (including public routes), allow access
    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // Don't block the request on errors, let the client handle auth
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
