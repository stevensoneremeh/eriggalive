import { AuthGuard } from "@/components/auth-guard"
import { DashboardClient } from "./dashboard-client"

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <DashboardClient />
    </AuthGuard>
  )
}
