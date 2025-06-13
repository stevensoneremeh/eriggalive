import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if the user is authenticated
  const isAuthenticated = !!session
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup")
  const isDashboardPage =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/vault") ||
    req.nextUrl.pathname.startsWith("/community") ||
    req.nextUrl.pathname.startsWith("/tickets") ||
    req.nextUrl.pathname.startsWith("/merch") ||
    req.nextUrl.pathname.startsWith("/chronicles") ||
    req.nextUrl.pathname.startsWith("/settings")

  // Allow access to public pages
  if (!isDashboardPage && !isAuthPage) {
    return res
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Redirect unauthenticated users away from protected pages
  if (!isAuthenticated && isDashboardPage) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return res
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|videos).*)"],
}
