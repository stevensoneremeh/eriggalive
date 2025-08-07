import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // Get user session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('Auth error in middleware:', error)
    }

    const { pathname, searchParams } = request.nextUrl

    // Define public paths that don't require authentication
    const publicPaths = [
      '/',
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/signup/success',
      '/terms',
      '/privacy',
      '/about',
      '/auth/callback',
      '/auth/auth-code-error',
    ]

    // Define protected paths that require authentication
    const protectedPaths = [
      '/dashboard',
      '/community',
      '/chronicles',
      '/vault',
      '/tickets',
      '/premium',
      '/merch',
      '/coins',
      '/settings',
      '/admin',
      '/mission',
      '/meet-and-greet',
      '/profile',
      '/rooms',
      '/chat',
    ]

    // Check if current path is public
    const isPublicPath = publicPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    )

    // Check if current path is protected
    const isProtectedPath = protectedPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    )

    // Skip auth checks for public paths
    if (isPublicPath) {
      // If user is authenticated and trying to access login/signup, redirect to dashboard
      if (user && (pathname === '/login' || pathname === '/signup')) {
        const redirectTo = searchParams.get('redirect') || '/dashboard'
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }
      return supabaseResponse
    }

    // If user is not authenticated and trying to access protected route
    if (!user && isProtectedPath) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow the request to continue
    return supabaseResponse
  }
}
