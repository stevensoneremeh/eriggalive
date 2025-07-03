"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home, MessageCircle } from "lucide-react"

/**
 * Very small, responsive sidebar for the chat area.
 * Extend or replace later with real data – this just
 * satisfies the import path to unblock the build.
 */
const rooms = [
  { slug: "/chat/general", label: "General", icon: MessageCircle },
  { slug: "/chat/freebies", label: "Freebies", icon: MessageCircle },
]

export default function ChatSidebar() {
  const pathname = usePathname()

  return (
    <aside className="border-r border-muted w-60 shrink-0 hidden md:flex flex-col">
      <div className="h-14 border-b flex items-center px-4 gap-2 font-semibold">
        <Home className="size-4" />
        <span>Chat</span>
      </div>

      <ScrollArea className="flex-1">
        <ul className="py-2">
          {rooms.map(({ slug, label, icon: Icon }) => (
            <li key={slug}>
              <Link
                href={slug}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md hover:bg-muted/50",
                  pathname?.startsWith(slug) && "bg-muted font-medium",
                )}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </aside>
  )
}
