import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next()

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
        const { data: session, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.warn("[SERVER] Session refresh error:", sessionError.message)
        } else if (session?.session) {
          const expiresAt = session.session.expires_at
          const now = Math.floor(Date.now() / 1000)
          const timeUntilExpiry = expiresAt ? expiresAt - now : 0

          // Refresh if token expires in less than 5 minutes
          if (timeUntilExpiry < 300) {
            try {
              await supabase.auth.refreshSession()
            } catch (refreshError: any) {
              console.warn("[SERVER] Token refresh error:", refreshError.message)
            }
          }
        }
      } catch (sessionError: any) {
        console.warn("[SERVER] Session management error:", sessionError.message)
      }
    }

    return supabaseResponse
  } catch (error: any) {
    console.error("[SERVER] Middleware execution error:", error.message)
    // Return the original response if there's an error
    return supabaseResponse
  }
}
