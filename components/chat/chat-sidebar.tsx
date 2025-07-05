"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface ChatSidebarProps {
  className?: string
}

const rooms = [
  { slug: "general", label: "General" },
  { slug: "freebies", label: "Freebies" },
]

export function ChatSidebar({ className }: ChatSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={cn("w-64 shrink-0 border-r", className)}>
      <ScrollArea className="h-full p-4">
        <nav className="flex flex-col gap-1">
          {rooms.map(({ slug, label }) => {
            const href = `/chat/${slug}`
            const active = pathname?.startsWith(href)
            return (
              <Link
                key={slug}
                href={href}
                className={cn(
                  "rounded px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-muted font-semibold" : "hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </aside>
  )
}

export default ChatSidebar
