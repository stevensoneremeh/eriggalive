"use client"
import { requireAuth, getAuthenticatedUser } from "@/lib/auth-guard"
import { ChatClient } from "./chat-client"

export default async function ChatPage() {
  await requireAuth()
  const authData = await getAuthenticatedUser()

  if (!authData) {
    return null
  }

  return <ChatClient initialAuthData={authData} />
}
