import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check if environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Missing Supabase environment variables in middleware")
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      },
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // Only log actual errors, not missing sessions
    if (error && !error.message.includes("Auth session missing") && !error.message.includes("JWT expired")) {
      console.error("Auth error in middleware:", error.message)
    }

    // Allow all requests to continue - we'll handle auth at the component level
    return supabaseResponse
  } catch (error: any) {
    // Handle JSON parsing errors and other unexpected errors
    if (error.message?.includes("Unexpected token") || error.message?.includes("Too Many R")) {
      console.warn("JSON parsing error in middleware, continuing with request")
    } else {
      console.error("Unexpected auth error in middleware:", error.message)
    }

    // Always allow the request to continue
    return supabaseResponse
  }
}
