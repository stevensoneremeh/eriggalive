import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Check if we're in preview mode
const isPreviewMode = (request: NextRequest) => {
  return (
    request.nextUrl.hostname.includes("vusercontent.net") ||
    request.nextUrl.hostname.includes("v0.dev") ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "preview"
  )
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip middleware for preview mode
  if (isPreviewMode(request)) {
    return supabaseResponse
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip middleware if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protected routes that require authentication
    const protectedPaths = ["/dashboard", "/community", "/premium", "/coins", "/vault", "/admin"]

    // Admin-only routes
    const adminPaths = ["/admin"]

    const { pathname } = request.nextUrl

    // Check if the current path is protected
    const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))
    const isAdminPath = adminPaths.some((path) => pathname.startsWith(path))

    // Redirect to login if accessing protected route without authentication
    if (isProtectedPath && !user) {
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check admin access
    if (isAdminPath && user) {
      try {
        const { data: userProfile } = await supabase
          .from("users")
          .select("role, tier")
          .eq("auth_user_id", user.id)
          .single()

        if (!userProfile || (userProfile.role !== "admin" && userProfile.tier !== "admin")) {
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      } catch (error) {
        console.error("Error checking admin access:", error)
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    // Redirect authenticated users away from auth pages
    if (user && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo")
      return NextResponse.redirect(new URL(redirectTo || "/dashboard", request.url))
    }

    return supabaseResponse
  } catch (error) {
    console.error("Middleware error:", error)
    // Return the response without modification if there's an error
    return supabaseResponse
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
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
