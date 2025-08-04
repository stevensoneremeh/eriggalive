"use client"
import { requireAuth, getAuthenticatedUser } from "@/lib/auth-guard"
import { ProfileClient } from "./profile-client"

export default async function ProfilePage() {
  await requireAuth()
  const authData = await getAuthenticatedUser()

  if (!authData) {
    return null
  }

  return <ProfileClient initialAuthData={authData} />
}
