// Edge Runtime safe middleware for Supabase
// Handles session refresh and auth verification without importing full Supabase SDK

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

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // Get auth cookies - check multiple possible Supabase cookie patterns
    let accessToken = request.cookies.get('sb-access-token')?.value
    let refreshToken = request.cookies.get('sb-refresh-token')?.value
    
    // Also check for project-specific cookies
    const allCookies = request.cookies.getAll()
    
    // Find access token: sb-*-auth-token (or plain sb-access-token)
    const accessCookie = allCookies.find(c => 
      (c.name.includes('sb-') && c.name.includes('auth-token')) ||
      c.name === 'sb-access-token'
    )
    
    // Find refresh token: sb-*-refresh-token (or plain sb-refresh-token)  
    const refreshCookie = allCookies.find(c =>
      (c.name.includes('sb-') && c.name.includes('refresh-token')) ||
      c.name === 'sb-refresh-token'
    )
    
    // Get cookie names for later updates
    let accessTokenCookieName = accessCookie?.name || 'sb-access-token'
    let refreshTokenCookieName = refreshCookie?.name || 'sb-refresh-token'
    
    // Use project-specific cookies if found
    if (accessCookie && !accessToken) {
      accessToken = accessCookie.value
    }
    if (refreshCookie && !refreshToken) {
      refreshToken = refreshCookie.value
    }

    // Helper function to refresh session
    const refreshSession = async (refreshTkn: string) => {
      try {
        const refreshResponse = await fetch(
          `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
            },
            body: JSON.stringify({
              refresh_token: refreshTkn,
            }),
          }
        )

        if (refreshResponse.ok) {
          const sessionData = await refreshResponse.json()
          
          // Set new cookies in response using original cookie names
          const cookieOptions = {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 7, // 7 days
          }
          
          supabaseResponse.cookies.set(accessTokenCookieName, sessionData.access_token, cookieOptions)
          supabaseResponse.cookies.set(refreshTokenCookieName, sessionData.refresh_token, cookieOptions)
          
          console.log('[Middleware] Session refreshed successfully')
          
          return {
            accessToken: sessionData.access_token,
            refreshToken: sessionData.refresh_token,
          }
        } else {
          console.warn('[Middleware] Session refresh failed:', refreshResponse.status)
          // Clear invalid tokens
          supabaseResponse.cookies.delete(accessTokenCookieName)
          supabaseResponse.cookies.delete(refreshTokenCookieName)
          return null
        }
      } catch (error) {
        console.error('[Middleware] Session refresh error:', error)
        return null
      }
    }

    // If we have a refresh token but no access token, refresh immediately
    if (refreshToken && !accessToken) {
      const refreshed = await refreshSession(refreshToken)
      if (refreshed) {
        accessToken = refreshed.accessToken
        refreshToken = refreshed.refreshToken
      }
    }

    // For admin routes, verify authentication
    if (request.nextUrl.pathname.startsWith("/admin")) {
      // If no valid access token, redirect to login
      if (!accessToken) {
        if (!request.nextUrl.pathname.startsWith("/login") && !request.nextUrl.pathname.startsWith("/auth")) {
          const url = request.nextUrl.clone()
          url.pathname = "/login"
          url.searchParams.set("redirect", request.nextUrl.pathname)
          return NextResponse.redirect(url)
        }
        return supabaseResponse
      }

      // Verify the access token via Supabase REST API (edge-safe)
      try {
        const userResponse = await fetch(
          `${supabaseUrl}/auth/v1/user`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'apikey': supabaseAnonKey,
            },
          }
        )

        if (userResponse.ok) {
          const user = await userResponse.json()
          
          // Special case: Always allow info@eriggalive.com
          if (user?.email === "info@eriggalive.com") {
            return supabaseResponse
          }

          // For other users, admin layout will handle role-based access
          return supabaseResponse
          
        } else if (userResponse.status === 401 && refreshToken) {
          // Token expired - try to refresh
          console.log('[Middleware] Access token expired, refreshing...')
          const refreshed = await refreshSession(refreshToken)
          
          if (refreshed) {
            // Verify new access token
            const retryResponse = await fetch(
              `${supabaseUrl}/auth/v1/user`,
              {
                headers: {
                  'Authorization': `Bearer ${refreshed.accessToken}`,
                  'apikey': supabaseAnonKey,
                },
              }
            )
            
            if (retryResponse.ok) {
              const user = await retryResponse.json()
              
              // Special case: Always allow info@eriggalive.com
              if (user?.email === "info@eriggalive.com") {
                return supabaseResponse
              }
              
              return supabaseResponse
            }
          }
          
          // Refresh failed or retry failed - redirect to login
          const url = request.nextUrl.clone()
          url.pathname = "/login"
          url.searchParams.set("redirect", request.nextUrl.pathname)
          return NextResponse.redirect(url)
          
        } else if (userResponse.status === 401) {
          // No refresh token or 401 without refresh token - redirect to login
          const url = request.nextUrl.clone()
          url.pathname = "/login"
          url.searchParams.set("redirect", request.nextUrl.pathname)
          return NextResponse.redirect(url)
        }
      } catch (error) {
        console.error("[Middleware] Auth verification error:", error)
        // On error, allow through and let page/API handle auth
      }
    }

    return supabaseResponse
  } catch (error: any) {
    console.error("[Middleware] Session update error:", error?.message)
    return supabaseResponse
  }
}
