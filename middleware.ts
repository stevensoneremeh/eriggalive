import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Public and Protected Path Configuration
  const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password']
  const PROTECTED_PATHS = ['/dashboard', '/profile', '/settings']

  const path = req.nextUrl.pathname
  const isPublicPath = PUBLIC_PATHS.includes(path)
  const isProtectedPath = PROTECTED_PATHS.includes(path)

  // Fetch the session
  const { data: { session } } = await supabase.auth.getSession()

  // Detailed Logging
  console.log('Middleware Auth Check:', {
    path,
    isPublicPath,
    isProtectedPath,
    hasSession: !!session
  })

  // Redirect Logic
  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isPublicPath && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
}
