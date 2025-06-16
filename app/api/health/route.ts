import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Health check response interface
interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    database: HealthCheck
    paystack: HealthCheck
    storage: HealthCheck
    auth: HealthCheck
    memory: HealthCheck
    disk: HealthCheck
  }
  metadata: {
    nodeVersion: string
    platform: string
    totalMemory: number
    freeMemory: number
    cpuUsage: number
  }
}

interface HealthCheck {
  status: "pass" | "fail" | "warn"
  responseTime: number
  message?: string
  details?: any
}

// Utility function to measure execution time
async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
  const start = Date.now()
  try {
    const result = await fn()
    return { result, time: Date.now() - start }
  } catch (error) {
    return { result: error as T, time: Date.now() - start }
  }
}

// Database health check
async function checkDatabase(): Promise<HealthCheck> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return {
        status: "fail",
        responseTime: 0,
        message: "Supabase configuration missing",
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { result, time } = await measureTime(async () => {
      const { data, error } = await supabase.from("users").select("count").limit(1).single()

      if (error) throw error
      return data
    })

    if (result instanceof Error) {
      return {
        status: "fail",
        responseTime: time,
        message: `Database error: ${result.message}`,
      }
    }

    return {
      status: time < 1000 ? "pass" : "warn",
      responseTime: time,
      message: time > 1000 ? "Slow database response" : "Database connection healthy",
    }
  } catch (error) {
    return {
      status: "fail",
      responseTime: 0,
      message: `Database check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Paystack health check
async function checkPaystack(): Promise<HealthCheck> {
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecret) {
      return {
        status: "fail",
        responseTime: 0,
        message: "Paystack configuration missing",
      }
    }

    const { result, time } = await measureTime(async () => {
      const response = await fetch("https://api.paystack.co/bank", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Paystack API returned ${response.status}`)
      }

      return await response.json()
    })

    if (result instanceof Error) {
      return {
        status: "fail",
        responseTime: time,
        message: `Paystack API error: ${result.message}`,
      }
    }

    return {
      status: time < 2000 ? "pass" : "warn",
      responseTime: time,
      message: time > 2000 ? "Slow Paystack response" : "Paystack API healthy",
    }
  } catch (error) {
    return {
      status: "fail",
      responseTime: 0,
      message: `Paystack check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Storage health check
async function checkStorage(): Promise<HealthCheck> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return {
        status: "fail",
        responseTime: 0,
        message: "Supabase storage configuration missing",
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { result, time } = await measureTime(async () => {
      const { data, error } = await supabase.storage.from("media").list("", { limit: 1 })

      if (error) throw error
      return data
    })

    if (result instanceof Error) {
      return {
        status: "fail",
        responseTime: time,
        message: `Storage error: ${result.message}`,
      }
    }

    return {
      status: time < 1500 ? "pass" : "warn",
      responseTime: time,
      message: time > 1500 ? "Slow storage response" : "Storage healthy",
    }
  } catch (error) {
    return {
      status: "fail",
      responseTime: 0,
      message: `Storage check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Auth health check
async function checkAuth(): Promise<HealthCheck> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        status: "fail",
        responseTime: 0,
        message: "Auth configuration missing",
      }
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { result, time } = await measureTime(async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return data
    })

    if (result instanceof Error) {
      return {
        status: "fail",
        responseTime: time,
        message: `Auth error: ${result.message}`,
      }
    }

    return {
      status: time < 1000 ? "pass" : "warn",
      responseTime: time,
      message: time > 1000 ? "Slow auth response" : "Auth service healthy",
    }
  } catch (error) {
    return {
      status: "fail",
      responseTime: 0,
      message: `Auth check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Memory health check
function checkMemory(): HealthCheck {
  try {
    const memUsage = process.memoryUsage()
    const totalMemory = memUsage.heapTotal
    const usedMemory = memUsage.heapUsed
    const memoryUsagePercent = (usedMemory / totalMemory) * 100

    return {
      status: memoryUsagePercent < 80 ? "pass" : memoryUsagePercent < 90 ? "warn" : "fail",
      responseTime: 0,
      message: `Memory usage: ${memoryUsagePercent.toFixed(2)}%`,
      details: {
        heapUsed: Math.round(usedMemory / 1024 / 1024),
        heapTotal: Math.round(totalMemory / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
    }
  } catch (error) {
    return {
      status: "fail",
      responseTime: 0,
      message: `Memory check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Disk health check (simplified for serverless)
function checkDisk(): HealthCheck {
  try {
    // In serverless environments, disk space is managed by the platform
    // We'll just check if we can access the filesystem
    const canWrite = process.env.VERCEL ? false : true // Vercel is read-only

    return {
      status: "pass",
      responseTime: 0,
      message: canWrite ? "Disk access available" : "Read-only filesystem (serverless)",
      details: {
        platform: process.env.VERCEL ? "Vercel" : "Unknown",
        readOnly: !canWrite,
      },
    }
  } catch (error) {
    return {
      status: "fail",
      responseTime: 0,
      message: `Disk check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Get system metadata
function getSystemMetadata() {
  const memUsage = process.memoryUsage()

  return {
    nodeVersion: process.version,
    platform: process.platform,
    totalMemory: Math.round(memUsage.heapTotal / 1024 / 1024),
    freeMemory: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024),
    cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Run all health checks in parallel
    const [database, paystack, storage, auth] = await Promise.all([
      checkDatabase(),
      checkPaystack(),
      checkStorage(),
      checkAuth(),
    ])

    const memory = checkMemory()
    const disk = checkDisk()

    // Determine overall status
    const checks = { database, paystack, storage, auth, memory, disk }
    const hasFailures = Object.values(checks).some((check) => check.status === "fail")
    const hasWarnings = Object.values(checks).some((check) => check.status === "warn")

    const overallStatus = hasFailures ? "unhealthy" : hasWarnings ? "degraded" : "healthy"

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      checks,
      metadata: getSystemMetadata(),
    }

    // Set appropriate HTTP status code
    const httpStatus = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503

    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    const errorResponse: HealthCheckResponse = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      checks: {
        database: { status: "fail", responseTime: 0, message: "Health check failed" },
        paystack: { status: "fail", responseTime: 0, message: "Health check failed" },
        storage: { status: "fail", responseTime: 0, message: "Health check failed" },
        auth: { status: "fail", responseTime: 0, message: "Health check failed" },
        memory: { status: "fail", responseTime: 0, message: "Health check failed" },
        disk: { status: "fail", responseTime: 0, message: "Health check failed" },
      },
      metadata: getSystemMetadata(),
    }

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }
}
