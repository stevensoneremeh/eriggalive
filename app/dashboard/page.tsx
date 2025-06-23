import ResponsiveSidebar from "@/components/ResponsiveSidebar"
import TierDashboardWrapper from "@/components/TierDashboardWrapper"

export default function DashboardPage() {
  return (
    <ResponsiveSidebar>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <TierDashboardWrapper />
      </div>
    </ResponsiveSidebar>
  )
}
