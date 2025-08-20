import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isAdminUser } from "@/lib/admin-auth"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ isAdmin: false, error: "No authorization header" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    // Verify JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ isAdmin: false, error: "Invalid token" }, { status: 401 })
    }

    // Check admin status
    const isAdmin = await isAdminUser(user.id, user.email)

    return NextResponse.json({
      isAdmin,
      userId: user.id,
      email: user.email,
    })
  } catch (error) {
    console.error("Admin check error:", error)
    return NextResponse.json({ isAdmin: false, error: "Internal server error" }, { status: 500 })
  }
}
