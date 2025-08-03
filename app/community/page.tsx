"use client"
import { requireAuth, getAuthenticatedUser } from "@/lib/auth-guard"
import { CommunityClient } from "./community-client"

interface Post {
  id: string
  content: string
  created_at: string
  updated_at: string
  author_id: string
  likes_count: number
  comments_count: number
  author: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    tier: string
  }
  user_has_liked: boolean
}

interface Comment {
  id: string
  content: string
  created_at: string
  author_id: string
  post_id: string
  author: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    tier: string
  }
}

export default async function CommunityPage() {
  await requireAuth()
  const authData = await getAuthenticatedUser()

  if (!authData) {
    return null
  }

  return <CommunityClient initialAuthData={authData} />
}

// CommunityClient component remains unchanged as it is not part of the updates
