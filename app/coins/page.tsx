"use client"

import { EriggaCoinDashboard } from "@/components/erigga-coin-dashboard"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

export default function CoinsPage() {
  return (
    <DashboardLayout>
      <EriggaCoinDashboard />
    </DashboardLayout>
  )
}
