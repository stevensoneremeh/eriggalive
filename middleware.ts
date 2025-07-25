import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Define protected routes
  const protectedRoutes = [
    "/dashboard",
    "/profile",
    "/community",
    "/vault",
    "/meet-greet",
    "/coins",
    "/admin",
    "/chat",
    "/rooms",
    "/tickets",
    "/premium",
    "/chronicles",
  ]

  // Define admin routes
  const adminRoutes = ["/admin"]

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

  // If it's a protected route and user is not authenticated
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If it's an admin route, check for admin privileges
  if (isAdminRoute && session) {
    try {
      const { data: profile } = await supabase.from("profiles").select("tier").eq("id", session.user.id).single()

      if (!profile || !["admin", "mod"].includes(profile.tier?.toLowerCase())) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    } catch (error) {
      console.error("Error checking admin privileges:", error)
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (session && ["/login", "/signup", "/forgot-password", "/reset-password"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
