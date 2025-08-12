import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard" // Default redirect to dashboard instead of home

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        const forwardedHost = request.headers.get("x-forwarded-host")
        const isLocalEnv = process.env.NODE_ENV === "development"

        const redirectUrl = next === "/" ? "/dashboard" : next

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${redirectUrl}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`)
        } else {
          return NextResponse.redirect(`${origin}${redirectUrl}`)
        }
      } else {
        console.error("Auth callback error:", error)
      }
    } catch (error) {
      console.error("Auth callback exception:", error)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
