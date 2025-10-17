
"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchWithRetry } from "@/lib/utils/fetchWithRetry"
import { debounce } from "@/lib/utils/debounce"
import { dedupe } from "@/lib/utils/dedupe"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  totalWithdrawals: number
  pendingWithdrawals: number
  totalEvents: number
  upcomingEvents: number
  totalMerchOrders: number
  pendingOrders: number
  cached?: boolean
}

// Dedupe the fetch function to prevent parallel duplicate requests
const fetchStatsDeduped = dedupe(async () => {
  return await fetchWithRetry<{ success: boolean } & AdminStats>(
    "/api/admin/dashboard-stats",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
    3,
    1000
  )
})

export function useAdminStats() {
  const [data, setData] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(
    debounce(async () => {
      // Short-circuit if disabled via env flag
      if (process.env.NEXT_PUBLIC_DISABLE_ADMIN_STATS === 'true') {
        setData(null)
        setLoading(false)
        setError("Admin stats temporarily disabled")
        return
      }

      try {
        setLoading(true)
        setError(null)

        const stats = await fetchStatsDeduped()

        if (stats.success) {
          setData(stats)
        } else {
          throw new Error("Failed to fetch stats")
        }
      } catch (err) {
        console.error("Admin stats error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch stats")
      } finally {
        setLoading(false)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { data, loading, error, refetch: fetchStats }
}
