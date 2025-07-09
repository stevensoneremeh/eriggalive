import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/* ------------------------------------------------------------------ */
/* Middleware Logging                                                 */
/* ------------------------------------------------------------------ */

const LOG_PREFIX = "[Middleware]"

function logMiddleware(event: string, details?: any) {
  const timestamp = new Date().toISOString()
  console.log(`${LOG_PREFIX} ${timestamp} - ${event}`, details ? JSON.stringify(details, null, 2) : "")
}

function logMiddlewareError(context: string, error: any) {
  const timestamp = new Date().toISOString()
  console.error(`${LOG_PREFIX} ${timestamp} - ERROR in ${context}:`, error)
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const path = request.nextUrl.pathname
  const userAgent = request.headers.get("user-agent")
  const referer = request.headers.get("referer")

  logMiddleware("Request started", {
    path,
    method: request.method,
    userAgent: userAgent?.substring(0, 100),
    referer,
    hasAuthCookies: request.cookies.getAll().some((c) => c.name.startsWith("sb-")),
  })

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          logMiddleware("Reading cookies", {
            totalCookies: cookies.length,
            authCookies: cookies.filter((c) => c.name.startsWith("sb-")).length,
          })
          return cookies
        },
        setAll(cookiesToSet) {
          const authCookies = cookiesToSet.filter((c) => c.name.startsWith("sb-"))

          if (authCookies.length > 0) {
            logMiddleware("Setting cookies", {
              authCookieCount: authCookies.length,
              cookieNames: authCookies.map((c) => c.name),
            })
          }

          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  try {
    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      logMiddlewareError("Auth Check", authError)
    }

    logMiddleware("Auth check completed", {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
    })

    // Protected routes that require authentication
    const protectedRoutes = ["/dashboard", "/admin", "/chat", "/coins", "/premium", "/vault"]
    const authRoutes = ["/login", "/signup"]

    const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))
    const isAuthRoute = authRoutes.some((route) => path.startsWith(route))

    logMiddleware("Route analysis", {
      path,
      isProtectedRoute,
      isAuthRoute,
      hasUser: !!user,
    })

    // Redirect authenticated users away from auth pages
    if (user && isAuthRoute) {
      logMiddleware("Redirecting authenticated user from auth page", {
        from: path,
        to: "/dashboard",
        userId: user.id,
      })

      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    // Redirect unauthenticated users from protected routes to login
    if (!user && isProtectedRoute) {
      logMiddleware("Redirecting unauthenticated user to login", {
        from: path,
        to: "/login",
      })

      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("redirect", path)
      return NextResponse.redirect(url)
    }

    // Admin route protection
    if (path.startsWith("/admin")) {
      if (!user) {
        logMiddleware("Admin route access denied - no user", { path })
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
      }

      // Check if user has admin access
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("tier, username")
        .eq("auth_user_id", user.id)
        .single()

      if (profileError) {
        logMiddlewareError("Profile fetch for admin check", profileError)
      }

      const hasAdminAccess = profile?.tier === "admin" || profile?.tier === "mod"

      logMiddleware("Admin access check", {
        userId: user.id,
        username: profile?.username,
        tier: profile?.tier,
        hasAdminAccess,
        path,
      })

      if (!hasAdminAccess) {
        logMiddleware("Admin route access denied - insufficient permissions", {
          userId: user.id,
          tier: profile?.tier,
          path,
        })

        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    }

    const processingTime = Date.now() - startTime
    logMiddleware("Request completed", {
      path,
      processingTime: `${processingTime}ms`,
      hasUser: !!user,
      finalAction: "continue",
    })
  } catch (error) {
    logMiddlewareError("Middleware execution", error)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
