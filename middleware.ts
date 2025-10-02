import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  try {
    const response = await updateSession(request)
    return response
  } catch (error: any) {
    console.error("[SERVER] Middleware execution failed:", error.message)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
