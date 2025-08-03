import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/types/database"

export async function updateSession(request: NextRequest) {
  // Check if Supabase environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase environment variables not configured, skipping auth middleware")
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createMiddlewareClient<Database>({ req: request, res: response })

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { pathname } = request.nextUrl

    // Define protected routes
    const protectedRoutes = [
      "/dashboard",
      "/community",
      "/vault",
      "/chat",
      "/tickets",
      "/premium",
      "/merch",
      "/coins",
      "/settings",
      "/admin",
      "/profile",
      "/chronicles",
      "/missions",
      "/meet-and-greet",
    ]

    // Define public routes
    const publicRoutes = [
      "/",
      "/auth/signin",
      "/auth/signup",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/about",
      "/terms",
      "/privacy",
    ]

    // Allow API routes and static files
    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon") ||
      pathname.includes(".")
    ) {
      return response
    }

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
    const isPublicRoute = publicRoutes.includes(pathname)

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !session) {
      const redirectUrl = new URL("/auth/signin", request.url)
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users from auth pages to dashboard
    if (session && (pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/signup"))) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}
