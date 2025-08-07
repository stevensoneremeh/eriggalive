import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // Only log actual errors, not missing sessions (which is normal for unauthenticated users)
    if (error && !error.message?.includes('Auth session missing')) {
      console.error('Auth error in middleware:', error.message)
    }

    // Don't redirect if user is null - this is normal for public pages
    return supabaseResponse
  } catch (error: any) {
    // Only log unexpected errors
    if (!error.message?.includes('Auth session missing')) {
      console.error('Middleware error:', error)
    }
    return supabaseResponse
  }
}
