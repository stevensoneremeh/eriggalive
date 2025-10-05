import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[Middleware] Supabase environment variables not configured')
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
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
    },
  )

  // Refresh the session to ensure we have the latest auth state
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error("[Middleware] Session error:", error)
  }

  const user = session?.user

  // Only redirect to login if user is not authenticated and trying to access protected routes
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // For admin routes, check if user has admin privileges (but don't redirect if they don't - let the admin layout handle it)
  if (user && request.nextUrl.pathname.startsWith("/admin")) {
    try {
      // Special case: Always allow info@eriggalive.com
      if (user.email === "info@eriggalive.com") {
        return supabaseResponse
      }

      // Check user profile for admin access
      const { data: profile } = await supabase
        .from("users")
        .select("role, tier")
        .eq("auth_user_id", user.id)
        .single()

      // Allow admin access for certain roles/tiers
      if (
        profile?.role === "admin" ||
        profile?.role === "super_admin" ||
        profile?.tier === "enterprise"
      ) {
        return supabaseResponse
      }

      // Don't redirect here - let the admin layout handle access denial
      // This prevents the redirect loop
    } catch (adminCheckError) {
      console.error("[Middleware] Admin check error:", adminCheckError)
      // Continue without redirect on error
    }
  }

  return supabaseResponse
}
