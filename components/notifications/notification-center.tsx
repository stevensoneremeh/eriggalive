"use client"

import { useState, useEffect } from "react"
import { Bell, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  data?: any
}

interface UserProfile {
  id: number
  auth_user_id: string
  username: string
  display_name: string
  email: string
  subscription_tier: string
  coins_balance: number
  is_active: boolean
}

export function NotificationCenter() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          setIsAuthenticated(true)
          // Fetch user profile
          const { data: userProfile } = await supabase
            .from("users")
            .select("*")
            .eq("auth_user_id", session.user.id)
            .single()

          if (userProfile) {
            setProfile(userProfile)
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error)
      }
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setIsAuthenticated(true)
        const { data: userProfile } = await supabase
          .from("users")
          .select("*")
          .eq("auth_user_id", session.user.id)
          .single()

        if (userProfile) {
          setProfile(userProfile)
        }
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false)
        setProfile(null)
        setNotifications([])
        setUnreadCount(0)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const fetchNotifications = async () => {
    if (!isAuthenticated || !profile?.auth_user_id) return

    setIsLoading(true)
    try {
      // Mock notifications for preview/development
      const mockNotifications: Notification[] = [
        {
          id: "1",
          user_id: profile.auth_user_id,
          title: "Welcome to Erigga Mission!",
          message: "Thanks for joining our community. Start exploring and earning coins!",
          type: "system",
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        },
        {
          id: "2",
          user_id: profile.auth_user_id,
          title: "New Post Liked",
          message: "Someone liked your post in the General category",
          type: "like",
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        },
        {
          id: "3",
          user_id: profile.auth_user_id,
          title: "Comment on Your Post",
          message: "TestUser commented on your post about music",
          type: "comment",
          is_read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
      ]

      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter((n) => !n.is_read).length)
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!profile?.auth_user_id) return

    try {
      // Update local state immediately for better UX
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))

      // In a real app, this would update the database
      console.log("Marking notification as read:", notificationId)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!profile?.auth_user_id) return

    try {
      // Update local state immediately
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)

      // In a real app, this would update the database
      console.log("Marking all notifications as read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!profile?.auth_user_id) return

    try {
      const notification = notifications.find((n) => n.id === notificationId)

      // Update local state immediately
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }

      // In a real app, this would delete from the database
      console.log("Deleting notification:", notificationId)
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return "❤️"
      case "comment":
        return "💬"
      case "follow":
        return "👥"
      case "mention":
        return "📢"
      case "system":
        return "🔔"
      default:
        return "📬"
    }
  }

  useEffect(() => {
    if (isAuthenticated && profile?.auth_user_id) {
      fetchNotifications()
    }
  }, [isAuthenticated, profile?.auth_user_id])

  useEffect(() => {
    if (!isAuthenticated || !profile?.auth_user_id) return

    // Set up real-time subscription for notifications
    let channel: any = null

    try {
      channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${profile.auth_user_id}`,
          },
          (payload) => {
            console.log("New notification received:", payload)
            setNotifications((prev) => [payload.new as Notification, ...prev])
            setUnreadCount((prev) => prev + 1)
          },
        )
        .subscribe()
    } catch (error) {
      console.error("Error setting up realtime subscription:", error)
    }

    return () => {
      if (channel) {
        try {
          if (supabase.removeChannel) {
            supabase.removeChannel(channel)
          } else if (channel.unsubscribe) {
            channel.unsubscribe()
          }
        } catch (error) {
          console.error("Error cleaning up channel:", error)
        }
      }
    }
  }, [isAuthenticated, profile?.auth_user_id, supabase])

  if (!isAuthenticated) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 transition-colors ${!notification.is_read ? "bg-accent/20" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setIsOpen(false)}>
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
