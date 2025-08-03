import { AuthGuard } from "@/components/auth-guard"
import { ChatClient } from "./chat-client"

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatClient />
    </AuthGuard>
  )
}
