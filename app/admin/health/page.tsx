import { Suspense } from "react"
import HealthDashboard from "@/components/health-dashboard"
import { Card, CardContent } from "@/components/ui/card"

export default function HealthPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Health Monitor</h1>
        <p className="text-muted-foreground">Monitor the health and performance of the Erigga fan platform</p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        }
      >
        <HealthDashboard />
      </Suspense>
    </div>
  )
}
