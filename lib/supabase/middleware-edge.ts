// Edge-safe middleware for Supabase authentication
// This version avoids importing Node.js APIs that cause Edge Runtime errors

import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[Middleware] Supabase environment variables not configured')
    return response
  }

  try {
    // Get the session token from cookies
    const accessToken = request.cookies.get('sb-access-token')?.value
    const refreshToken = request.cookies.get('sb-refresh-token')?.value

    // If no tokens, allow the request to proceed (auth will be handled by page/API)
    if (!accessToken && !refreshToken) {
      // Only redirect to login for protected routes
      if (
        request.nextUrl.pathname.startsWith("/admin") &&
        !request.nextUrl.pathname.startsWith("/login") &&
        !request.nextUrl.pathname.startsWith("/auth")
      ) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        url.searchParams.set("redirect", request.nextUrl.pathname)
        return NextResponse.redirect(url)
      }
      return response
    }

    // For admin routes with tokens, verify them via Supabase REST API (edge-safe)
    if (request.nextUrl.pathname.startsWith("/admin") && accessToken) {
      try {
        // Verify token by calling Supabase REST API directly (edge-safe)
        const userResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            },
          }
        )

        if (userResponse.ok) {
          const user = await userResponse.json()
          
          // Special case: Always allow info@eriggalive.com
          if (user.email === "info@eriggalive.com") {
            return response
          }

          // For other users, the admin layout will handle access control
          // We don't check database roles here to keep middleware edge-safe
        }
      } catch (error) {
        console.error('[Middleware] Token verification error:', error)
      }
    }

    return response
  } catch (error) {
    console.error('[Middleware] Session update error:', error)
    return response
  }
}
