"use client"

import { useState } from "react"
import { SendHorizonal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: number
  author: string
  body: string
}

/**
 * Ultra-lightweight “general chat” placeholder.
 * Replace with your real realtime chat implementation later.
 */
export default function GeneralChat() {
  const [messages, setMessages] = useState<Message[]>([{ id: 1, author: "System", body: "Welcome to General chat 🎉" }])
  const [draft, setDraft] = useState("")

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setMessages((prev) => [...prev, { id: Date.now(), author: "You", body: text }])
    setDraft("")
  }

  return (
    <section className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4 space-y-2">
        {messages.map((m) => (
          <p key={m.id}>
            <span className="font-semibold">{m.author}: </span>
            {m.body}
          </p>
        ))}
      </ScrollArea>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="border-t p-4 flex gap-2"
      >
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message…" />
        <Button type="submit" size="icon" aria-label="Send">
          <SendHorizonal className="size-4" />
        </Button>
      </form>
    </section>
  )
}
