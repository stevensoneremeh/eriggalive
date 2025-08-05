import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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
      },
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()
    const pathname = url.pathname

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

    // Define auth routes (should redirect if already logged in)
    const authRoutes = ["/login", "/signup", "/auth/signin", "/auth/signup"]

    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

    console.log("🔍 Middleware check:", {
      pathname,
      hasUser: !!user,
      isProtectedRoute,
      isAuthRoute,
    })

    // If user is not logged in and trying to access protected route
    if (!user && isProtectedRoute) {
      console.log("🚫 Redirecting to login - no user on protected route")
      url.pathname = "/login"
      url.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(url)
    }

    // If user is logged in and trying to access auth routes, redirect to dashboard
    if (user && isAuthRoute) {
      console.log("✅ Redirecting to dashboard - user already logged in")
      url.pathname = "/dashboard"
      url.searchParams.delete("redirectTo")
      return NextResponse.redirect(url)
    }

    console.log("✅ Allowing access to:", pathname)
    return supabaseResponse
  } catch (error) {
    console.error("❌ Middleware error:", error)
    // Don't block access on middleware errors
    return supabaseResponse
  }
}
