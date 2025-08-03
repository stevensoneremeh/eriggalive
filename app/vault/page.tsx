"use client"
import { requireAuth, getAuthenticatedUser } from "@/lib/auth-guard"
import { VaultClient } from "./vault-client"

interface VaultItem {
  id: string
  title: string
  description: string
  type: "audio" | "video" | "image" | "document"
  url: string
  thumbnail_url?: string
  duration?: number
  file_size?: number
  tier_required: string
  coin_cost: number
  is_premium: boolean
  views_count: number
  created_at: string
  artist?: string
  album?: string
  genre?: string
}

interface VaultUnlock {
  id: string
  user_id: string
  vault_item_id: string
  unlocked_at: string
}

export default async function VaultPage() {
  // Server-side auth check - redirects if not authenticated
  await requireAuth()

  // Get authenticated user data
  const authData = await getAuthenticatedUser()

  if (!authData) {
    return null
  }

  return <VaultClient initialAuthData={authData} />
}

// The rest of the code remains the same as it is not needed in the server component
