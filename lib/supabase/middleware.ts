import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[SERVER] Missing Supabase environment variables in middleware")
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      // Only log actual errors, not missing sessions
      if (error.message !== "Auth session missing!" && !error.message.includes("session_not_found")) {
        console.warn("[SERVER] Auth error in middleware:", error.message)
      }
      // Don't block the request for auth errors
      return supabaseResponse
    }

    if (user) {
      try {
        await supabase.auth.getSession()
      } catch (sessionError: any) {
        console.warn("[SERVER] Session refresh error:", sessionError.message)
      }
    }

    return supabaseResponse
  } catch (error: any) {
    console.error("[SERVER] Middleware execution error:", error.message)
    // Return the original response if there's an error
    return supabaseResponse
  }
}
