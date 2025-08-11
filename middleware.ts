import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from '@/lib/supabase/middleware'

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/signup/success",
  "/terms",
  "/privacy",
  "/about",
]

// Define paths that should always be accessible
const ALWAYS_ACCESSIBLE = [
  "/api",
  "/_next",
  "/favicon.ico",
  "/images",
  "/videos",
  "/fonts",
  "/placeholder",
  "/erigga",
]

// Define protected paths
const PROTECTED_PATHS = [
  "/dashboard",
  "/community",
  "/chronicles",
  "/vault",
  "/tickets",
  "/premium",
  "/merch",
  "/coins",
  "/settings",
  "/admin",
  "/mission",
  "/meet-and-greet",
]

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     * - static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api|images|videos|fonts|placeholder|erigga|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
