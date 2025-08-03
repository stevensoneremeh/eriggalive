import { requireAuth, getAuthenticatedUser } from "@/lib/auth-guard"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  await requireAuth()
  const authData = await getAuthenticatedUser()

  if (!authData) {
    return null
  }

  return <DashboardClient initialAuthData={authData} />
}
