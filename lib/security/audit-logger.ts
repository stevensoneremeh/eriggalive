import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

interface AuditLogEntry {
  action: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  resource?: string
  resourceId?: string
  oldValues?: any
  newValues?: any
  metadata?: any
  severity?: "low" | "medium" | "high" | "critical"
}

export class AuditLogger {
  private supabase: ReturnType<typeof createClient<Database>>
  private logQueue: AuditLogEntry[] = []
  private batchSize = 10
  private flushInterval = 5000 // 5 seconds

  constructor() {
    this.supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Batch process logs
    setInterval(() => {
      this.flushLogs()
    }, this.flushInterval)
  }

  async log(entry: AuditLogEntry): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      severity: entry.severity || this.determineSeverity(entry.action),
      metadata: {
        ...entry.metadata,
        timestamp: new Date().toISOString(),
        source: "erigga-platform",
      },
    }

    // Add to queue for batch processing
    this.logQueue.push(logEntry)

    // For critical events, flush immediately
    if (logEntry.severity === "critical") {
      await this.flushLogs()
    }

    // If queue is full, flush
    if (this.logQueue.length >= this.batchSize) {
      await this.flushLogs()
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return

    const logsToFlush = [...this.logQueue]
    this.logQueue = []

    try {
      const { error } = await this.supabase.from("audit_logs").insert(
        logsToFlush.map((entry) => ({
          action: entry.action as any,
          user_id: entry.userId ? Number.parseInt(entry.userId) : null,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          table_name: entry.resource,
          record_id: entry.resourceId ? Number.parseInt(entry.resourceId) : null,
          old_values: entry.oldValues,
          new_values: entry.newValues,
          metadata: entry.metadata,
          created_at: new Date().toISOString(),
        })),
      )

      if (error) {
        console.error("Failed to flush audit logs:", error)
        // Re-queue failed logs
        this.logQueue.unshift(...logsToFlush)
      }
    } catch (error) {
      console.error("Audit log flush error:", error)
      // Re-queue failed logs
      this.logQueue.unshift(...logsToFlush)
    }
  }

  private determineSeverity(action: string): "low" | "medium" | "high" | "critical" {
    const criticalActions = [
      "ADMIN_LOGIN",
      "USER_BANNED",
      "SECURITY_BREACH",
      "UNAUTHORIZED_ACCESS",
      "DATA_EXPORT",
      "SYSTEM_CONFIG_CHANGE",
    ]

    const highActions = ["LOGIN_FAILED", "ACCOUNT_LOCKED", "PASSWORD_RESET", "PERMISSION_DENIED", "SUSPICIOUS_ACTIVITY"]

    const mediumActions = ["USER_LOGIN", "USER_LOGOUT", "USER_REGISTERED", "PROFILE_UPDATED", "COIN_TRANSACTION"]

    if (criticalActions.includes(action)) return "critical"
    if (highActions.includes(action)) return "high"
    if (mediumActions.includes(action)) return "medium"
    return "low"
  }

  // Query audit logs with filtering
  async queryLogs(filters: {
    userId?: string
    action?: string
    startDate?: Date
    endDate?: Date
    severity?: string
    limit?: number
  }) {
    let query = this.supabase.from("audit_logs").select("*")

    if (filters.userId) {
      query = query.eq("user_id", Number.parseInt(filters.userId))
    }

    if (filters.action) {
      query = query.eq("action", filters.action)
    }

    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate.toISOString())
    }

    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate.toISOString())
    }

    if (filters.severity) {
      query = query.contains("metadata", { severity: filters.severity })
    }

    query = query.order("created_at", { ascending: false }).limit(filters.limit || 100)

    const { data, error } = await query

    if (error) throw error
    return data
  }
}

export const auditLogger = new AuditLogger()
