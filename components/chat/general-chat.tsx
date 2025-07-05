"use client"

import { useState, type FormEvent } from "react"
import { useGeneralChat } from "@/hooks/use-general-chat"
import { ChatMessage } from "@/components/chat-message"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Minimal GeneralChat implementation so existing pages build.
 * Replace this with your fully-featured chat when ready.
 */
export function GeneralChat() {
  const { messages, sendMessage, isLoading } = useGeneralChat()
  const [text, setText] = useState("")

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage(text)
    setText("")
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {isLoading ? "Loading…" : messages.map((m) => <ChatMessage key={m.id} message={m} />)}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} />
          <Button type="submit">Send</Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default GeneralChat
