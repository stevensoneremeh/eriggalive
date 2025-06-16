import { Suspense } from "react"
import PerformanceDashboard from "@/components/performance/performance-dashboard"
import { Card, CardContent } from "@/components/ui/card"

export default function PerformancePage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-24 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-16 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        }
      >
        <PerformanceDashboard />
      </Suspense>
    </div>
  )
}
