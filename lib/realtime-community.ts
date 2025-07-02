"use client"

import supabase from "@/lib/supabase/client"
import { useEffect, useState, useCallback } from "react"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

export interface CommunityPost {
  id: number
  user_id: string
  category_id: number
  title?: string
  content: string
  hashtags: string[]
  vote_count: number
  comment_count: number
  view_count: number
  is_published: boolean
  created_at: string
  updated_at: string
  users: {
    id: string
    username: string
    full_name: string
    email: string
    avatar_url?: string
    tier: string
    reputation_score: number
  }
  community_categories: {
    id: number
    name: string
    slug: string
    color: string
    icon: string
  }
  has_voted?: boolean
  is_bookmarked?: boolean
}

export interface CommunityComment {
  id: number
  post_id: number
  user_id: string
  parent_comment_id?: number
  content: string
  vote_count: number
  reply_count: number
  created_at: string
  users: {
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
}

export interface UserNotification {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  actor_id?: string
  data: Record<string, any>
}

export interface UserPresence {
  user_id: string
  status: "online" | "away" | "busy" | "offline"
  last_seen: string
  current_page?: string
}

// Real-time posts hook
export function useRealtimePosts(initialPosts: CommunityPost[] = []) {
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const supabaseClient = supabase

  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      // Subscribe to posts changes
      channel = supabaseClient
        .channel("community_posts_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "community_posts",
          },
          async (payload: RealtimePostgresChangesPayload<any>) => {
            console.log("Real-time post change:", payload)

            if (payload.eventType === "INSERT") {
              // Fetch the new post with user data
              const { data: newPost } = await supabaseClient
                .from("community_posts")
                .select(`
                  *,
                  users!inner (
                    id, username, full_name, email, avatar_url, tier, reputation_score
                  ),
                  community_categories!inner (
                    id, name, slug, color, icon
                  )
                `)
                .eq("id", payload.new.id)
                .single()

              if (newPost) {
                setPosts((prev) => [newPost, ...prev])
              }
            } else if (payload.eventType === "UPDATE") {
              setPosts((prev) => prev.map((post) => (post.id === payload.new.id ? { ...post, ...payload.new } : post)))
            } else if (payload.eventType === "DELETE") {
              setPosts((prev) => prev.filter((post) => post.id !== payload.old.id))
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "post_votes",
          },
          async (payload: RealtimePostgresChangesPayload<any>) => {
            // Update vote counts in real-time
            const { data: updatedPost } = await supabaseClient
              .from("community_posts")
              .select("id, vote_count")
              .eq("id", payload.new.post_id)
              .single()

            if (updatedPost) {
              setPosts((prev) =>
                prev.map((post) =>
                  post.id === updatedPost.id ? { ...post, vote_count: updatedPost.vote_count } : post,
                ),
              )
            }
          },
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabaseClient.removeChannel(channel)
      }
    }
  }, [supabaseClient])

  const refreshPosts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabaseClient
        .from("community_posts")
        .select(`
          *,
          users!inner (
            id, username, full_name, email, avatar_url, tier, reputation_score
          ),
          community_categories!inner (
            id, name, slug, color, icon
          )
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(50)

      if (data) {
        setPosts(data)
      }
    } catch (error) {
      console.error("Error refreshing posts:", error)
    } finally {
      setLoading(false)
    }
  }, [supabaseClient])

  return { posts, loading, refreshPosts }
}

// Real-time notifications hook
export function useRealtimeNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabaseClient = supabase

  useEffect(() => {
    if (!userId) return

    let channel: RealtimeChannel

    const setupNotifications = async () => {
      // Fetch initial notifications
      const { data } = await supabaseClient
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.is_read).length)
      }

      // Subscribe to new notifications
      channel = supabaseClient
        .channel(`notifications_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            setNotifications((prev) => [payload.new, ...prev])
            setUnreadCount((prev) => prev + 1)
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            setNotifications((prev) => prev.map((notif) => (notif.id === payload.new.id ? payload.new : notif)))
            if (payload.new.is_read && !payload.old.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1))
            }
          },
        )
        .subscribe()
    }

    setupNotifications()

    return () => {
      if (channel) {
        supabaseClient.removeChannel(channel)
      }
    }
  }, [userId, supabaseClient])

  const markAsRead = useCallback(
    async (notificationId: number) => {
      await supabaseClient.from("notifications").update({ is_read: true }).eq("id", notificationId)
    },
    [supabaseClient],
  )

  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    await supabaseClient.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false)

    setUnreadCount(0)
  }, [userId, supabaseClient])

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}

// Real-time presence hook
export function useRealtimePresence(currentUserId?: string) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([])
  const supabaseClient = supabase

  useEffect(() => {
    if (!currentUserId) return

    let channel: RealtimeChannel
    let presenceInterval: NodeJS.Timeout

    const setupPresence = async () => {
      // Update user presence
      const updatePresence = async (status = "online") => {
        await supabaseClient.from("user_presence").upsert({
          user_id: currentUserId,
          status,
          last_seen: new Date().toISOString(),
          current_page: window.location.pathname,
          updated_at: new Date().toISOString(),
        })
      }

      // Initial presence update
      await updatePresence("online")

      // Set up periodic presence updates
      presenceInterval = setInterval(() => {
        updatePresence("online")
      }, 30000) // Update every 30 seconds

      // Subscribe to presence changes
      channel = supabaseClient
        .channel("user_presence_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_presence",
          },
          async () => {
            // Fetch updated online users
            const { data } = await supabaseClient
              .from("user_presence")
              .select("*")
              .eq("status", "online")
              .gte("last_seen", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes

            if (data) {
              setOnlineUsers(data)
            }
          },
        )
        .subscribe()

      // Handle page visibility changes
      const handleVisibilityChange = () => {
        if (document.hidden) {
          updatePresence("away")
        } else {
          updatePresence("online")
        }
      }

      // Handle page unload
      const handleBeforeUnload = () => {
        updatePresence("offline")
      }

      document.addEventListener("visibilitychange", handleVisibilityChange)
      window.addEventListener("beforeunload", handleBeforeUnload)

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange)
        window.removeEventListener("beforeunload", handleBeforeUnload)
      }
    }

    setupPresence()

    return () => {
      if (channel) {
        supabaseClient.removeChannel(channel)
      }
      if (presenceInterval) {
        clearInterval(presenceInterval)
      }
      // Set user offline when component unmounts
      supabaseClient.from("user_presence").upsert({
        user_id: currentUserId,
        status: "offline",
        last_seen: new Date().toISOString(),
      })
    }
  }, [currentUserId, supabaseClient])

  return { onlineUsers }
}

// Real-time comments hook
export function useRealtimeComments(postId: number) {
  const [comments, setComments] = useState<CommunityComment[]>([])
  const supabaseClient = supabase

  useEffect(() => {
    let channel: RealtimeChannel

    const setupCommentsSubscription = async () => {
      // Fetch initial comments
      const { data } = await supabaseClient
        .from("community_comments")
        .select(`
          *,
          users!inner (
            username, full_name, avatar_url, tier
          )
        `)
        .eq("post_id", postId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })

      if (data) {
        setComments(data)
      }

      // Subscribe to comment changes
      channel = supabaseClient
        .channel(`comments_${postId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "community_comments",
            filter: `post_id=eq.${postId}`,
          },
          async (payload: RealtimePostgresChangesPayload<any>) => {
            // Fetch the new comment with user data
            const { data: newComment } = await supabaseClient
              .from("community_comments")
              .select(`
                *,
                users!inner (
                  username, full_name, avatar_url, tier
                )
              `)
              .eq("id", payload.new.id)
              .single()

            if (newComment) {
              setComments((prev) => [...prev, newComment])
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "community_comments",
            filter: `post_id=eq.${postId}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            setComments((prev) =>
              prev.map((comment) => (comment.id === payload.new.id ? { ...comment, ...payload.new } : comment)),
            )
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "community_comments",
            filter: `post_id=eq.${postId}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            setComments((prev) => prev.filter((comment) => comment.id !== payload.old.id))
          },
        )
        .subscribe()
    }

    setupCommentsSubscription()

    return () => {
      if (channel) {
        supabaseClient.removeChannel(channel)
      }
    }
  }, [postId, supabaseClient])

  return { comments }
}
