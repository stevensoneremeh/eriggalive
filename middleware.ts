import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api",
  "/_next",
  "/favicon.ico",
  "/images",
  "/videos",
  "/fonts",
]

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl

  // Check if the path is public
  const isPublicPath =
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) || pathname.includes(".")

  // Check if the user is authenticated by looking for the auth cookie
  const isAuthenticated = request.cookies.has("erigga_auth")

  // If accessing a protected route without authentication
  if (!isPublicPath && !isAuthenticated) {
    // Store the original URL to redirect back after login
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname)

    // Create the response with the redirect
    const response = NextResponse.redirect(redirectUrl)

    // Add a temporary cookie to indicate where to redirect after login
    response.cookies.set("redirect_after_login", pathname, {
      path: "/",
      maxAge: 60 * 5, // 5 minutes
      httpOnly: true,
      sameSite: "lax",
    })

    return response
  }

  // If already authenticated and trying to access login/signup pages
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    // Check if there's a redirect parameter
    const redirectParam = request.nextUrl.searchParams.get("redirect")

    // Redirect to the specified path or dashboard
    const redirectUrl = redirectParam || "/dashboard"
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
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
