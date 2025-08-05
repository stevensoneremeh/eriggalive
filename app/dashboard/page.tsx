import { Suspense } from "react"
import { DashboardClient } from "./dashboard-client"
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        }
      >
        <DashboardClient />
      </Suspense>
    </AuthGuard>
  )
}
