"use client"
import { requireAuth, getAuthenticatedUser } from "@/lib/auth-guard"
import { DashboardClient } from "./dashboard-client"

interface DashboardStats {
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalFollowers: number
  vaultAccess: number
  recentActivity: any[]
}

export default async function DashboardPage() {
  // Server-side auth check - redirects if not authenticated
  await requireAuth()

  // Get authenticated user data
  const authData = await getAuthenticatedUser()

  if (!authData) {
    // This shouldn't happen due to requireAuth, but just in case
    return null
  }

  return <DashboardClient initialAuthData={authData} />
}

// DashboardClient component remains unchanged as it is not part of the updates
