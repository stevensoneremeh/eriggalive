import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChatRooms } from "@/components/chat/chat-rooms"

export default async function ChatPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="h-screen bg-gray-50">
      <ChatRooms />
    </div>
  )
}
