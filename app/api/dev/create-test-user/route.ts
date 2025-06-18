import { NextResponse } from "next/server"
import { createTestUser } from "@/lib/create-test-user"

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "This endpoint is only available in development mode" }, { status: 403 })
  }

  try {
    const result = await createTestUser()

    if (result.success) {
      return NextResponse.json({ success: true, userId: result.userId })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
