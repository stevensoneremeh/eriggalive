import { type NextRequest, NextResponse } from "next/server"
import { userSyncService } from "@/lib/user-sync-service"
import { requireAdmin } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin()

    // Get sync logs and integrity check
    const [syncLogs, integrityCheck] = await Promise.all([
      userSyncService.getSyncLogs(20),
      userSyncService.checkDataIntegrity(),
    ])

    return NextResponse.json({
      success: true,
      syncLogs,
      integrityCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching sync status:", error)

    if (error instanceof Error && error.message.includes("Admin access required")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(
      {
        error: "Failed to fetch sync status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin()

    const body = await request.json()
    const { dryRun = true, deleteOrphaned = false, updateExisting = true, createMissing = true } = body

    console.log("Starting user sync with options:", {
      dryRun,
      deleteOrphaned,
      updateExisting,
      createMissing,
    })

    const result = await userSyncService.syncUsers({
      dryRun,
      deleteOrphaned,
      updateExisting,
      createMissing,
    })

    const message = dryRun
      ? `Sync preview completed: ${result.created} would be created, ${result.updated} would be updated, ${result.deleted} would be deleted`
      : `Sync completed: ${result.created} created, ${result.updated} updated, ${result.deleted} deleted`

    return NextResponse.json({
      success: result.success,
      message,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error performing sync:", error)

    if (error instanceof Error && error.message.includes("Admin access required")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(
      {
        error: "Sync operation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
