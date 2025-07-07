import { requireAdmin } from "@/lib/auth-utils"
import { UserSyncDashboard } from "@/components/admin/user-sync-dashboard"
import { redirect } from "next/navigation"

export default async function AdminSyncPage() {
  try {
    await requireAdmin()
  } catch (error) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8">
      <UserSyncDashboard />
    </div>
  )
}
