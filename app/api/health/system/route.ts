import { NextResponse } from "next/server"

export async function GET() {
  try {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024), // MB
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000), // microseconds to milliseconds
        system: Math.round(cpuUsage.system / 1000), // microseconds to milliseconds
      },
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasPaystackKey: !!process.env.PAYSTACK_SECRET_KEY,
        hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      },
    }

    return NextResponse.json(systemInfo, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get system info",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
