"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { EriggaCoinDashboard } from "@/components/erigga-coin-dashboard"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your Erigga Fan Platform dashboard</p>
        </div>
        <EriggaCoinDashboard />
      </div>
    </DashboardLayout>
  )
}
