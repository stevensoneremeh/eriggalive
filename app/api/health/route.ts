import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { environment } from "@/lib/config/environment"

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: {
    database: {
      status: "healthy" | "unhealthy"
      responseTime: number
      error?: string
    }
    auth: {
      status: "healthy" | "unhealthy"
      responseTime: number
      error?: string
    }
    storage: {
      status: "healthy" | "unhealthy"
      responseTime: number
      error?: string
    }
    external: {
      paystack: {
        status: "healthy" | "unhealthy"
        responseTime: number
        error?: string
      }
    }
  }
  metrics: {
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage?: number
  }
}

export async function GET() {
  const startTime = Date.now()
  const healthCheck: HealthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: environment.get("app").version,
    environment: environment.get("app").environment,
    uptime: process.uptime(),
    checks: {
      database: { status: "healthy", responseTime: 0 },
      auth: { status: "healthy", responseTime: 0 },
      storage: { status: "healthy", responseTime: 0 },
      external: {
        paystack: { status: "healthy", responseTime: 0 },
      },
    },
    metrics: {
      memoryUsage: process.memoryUsage(),
    },
  }

  try {
    // Check database connectivity
    const dbStart = Date.now()
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      const { error } = await supabase.from("users").select("count").limit(1).single()

      healthCheck.checks.database.responseTime = Date.now() - dbStart

      if (error && !error.message.includes("PGRST116")) {
        // PGRST116 is "no rows returned" which is fine for health check
        throw error
      }
    } catch (error) {
      healthCheck.checks.database.status = "unhealthy"
      healthCheck.checks.database.error = error instanceof Error ? error.message : "Database connection failed"
      healthCheck.status = "degraded"
    }

    // Check auth service
    const authStart = Date.now()
    try {
      // Simple auth service health check
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      await supabase.auth.getSession()
      healthCheck.checks.auth.responseTime = Date.now() - authStart
    } catch (error) {
      healthCheck.checks.auth.status = "unhealthy"
      healthCheck.checks.auth.error = error instanceof Error ? error.message : "Auth service failed"
      healthCheck.status = "degraded"
    }

    // Check storage
    const storageStart = Date.now()
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      const { error } = await supabase.storage.listBuckets()
      healthCheck.checks.storage.responseTime = Date.now() - storageStart

      if (error) {
        throw error
      }
    } catch (error) {
      healthCheck.checks.storage.status = "unhealthy"
      healthCheck.checks.storage.error = error instanceof Error ? error.message : "Storage service failed"
      healthCheck.status = "degraded"
    }

    // Check external services (Paystack)
    if (environment.validatePaymentConfig()) {
      const paystackStart = Date.now()
      try {
        const response = await fetch("https://api.paystack.co/bank", {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        })

        healthCheck.checks.external.paystack.responseTime = Date.now() - paystackStart

        if (!response.ok) {
          throw new Error(`Paystack API returned ${response.status}`)
        }
      } catch (error) {
        healthCheck.checks.external.paystack.status = "unhealthy"
        healthCheck.checks.external.paystack.error = error instanceof Error ? error.message : "Paystack service failed"
        healthCheck.status = "degraded"
      }
    }

    // Determine overall status
    const unhealthyChecks = Object.values(healthCheck.checks).filter((check) => {
      if ("status" in check) {
        return check.status === "unhealthy"
      }
      return Object.values(check).some((subCheck) => subCheck.status === "unhealthy")
    })

    if (unhealthyChecks.length > 0) {
      healthCheck.status = unhealthyChecks.length >= 2 ? "unhealthy" : "degraded"
    }

    // Add response time
    const totalResponseTime = Date.now() - startTime

    // Return appropriate status code
    const statusCode = healthCheck.status === "healthy" ? 200 : healthCheck.status === "degraded" ? 200 : 503

    return NextResponse.json(
      {
        ...healthCheck,
        responseTime: totalResponseTime,
      },
      {
        status: statusCode,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("Health check error:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Health check failed",
        responseTime: Date.now() - startTime,
      },
      { status: 503 },
    )
  }
}
