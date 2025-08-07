import { createMiddlewareClient } from '@supabase/auth-helpers/nextjs'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// Define public routes
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/signup/success',
  '/terms',
  '/privacy',
  '/about',
]

const PROTECTED_PATHS = [
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
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createMiddlewareClient<Database>({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  const isProtected = PROTECTED_PATHS.some(path =>
    pathname.startsWith(path)
  )

  const isPublic = PUBLIC_PATHS.some(path =>
    pathname.startsWith(path)
  )

  if (isProtected && !session) {
    // Redirect unauthenticated user to login
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
