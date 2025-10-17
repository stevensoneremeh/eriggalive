"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellRing } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// Simple notification bell that doesn't interfere with existing functionality
export function SimpleNotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      // Simulate some notifications for demo
      setUnreadCount(3)
    }
  }, [user])

  if (!user) return null

  return (
    <Button variant="ghost" size="icon" className="relative">
      {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  )
}
