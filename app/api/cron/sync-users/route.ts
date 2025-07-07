import { type NextRequest, NextResponse } from "next/server"
import { userSyncService } from "@/lib/user-sync-service"

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting scheduled user synchronization...")

    // Perform automated sync with conservative settings
    const result = await userSyncService.syncUsers({
      dryRun: false,
      deleteOrphaned: false, // Don't auto-delete in scheduled runs
      updateExisting: true,
      createMissing: true,
    })

    console.log("Scheduled user synchronization completed:", result)

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Scheduled user sync error:", error)
    return NextResponse.json(
      {
        error: "Sync failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
