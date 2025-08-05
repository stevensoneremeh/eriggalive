import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  try {
    console.log("🔄 Middleware processing:", request.nextUrl.pathname)

    const response = await updateSession(request)

    console.log("✅ Middleware completed for:", request.nextUrl.pathname)
    return response
  } catch (error) {
    console.error("❌ Middleware execution error:", error)

    // Return a basic response if middleware fails - don't block access
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (let them handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
