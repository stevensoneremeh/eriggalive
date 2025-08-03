import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

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
const ALWAYS_ACCESSIBLE = ["/api", "/_next", "/favicon.ico", "/images", "/videos", "/fonts", "/placeholder", "/erigga"]

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
