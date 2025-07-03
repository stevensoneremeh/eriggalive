"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { useAuth } from "./auth-context"

interface User {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  tier: string
}

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  post_count?: number
  display_order?: number
}

interface Post {
  id: number
  content: string
  hashtags?: string[]
  media_url?: string
  media_type?: string
  vote_count: number
  comment_count: number
  view_count: number
  is_pinned: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  user: User
  category: Category
  has_voted: boolean
}

interface CommunityContextType {
  posts: Post[]
  categories: Category[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined)

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile } = useAuth()
  const supabase = createClientComponentClient<Database>()

  const loadPosts = async () => {
    try {
      const response = await fetch("/api/community/posts")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch posts")
      }

      setPosts(data.posts || [])
    } catch (err) {
      console.error("Error fetching posts:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch posts")
      setPosts([])
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/community/categories")
      const data = await response.json()

      setCategories(data.categories || [])
    } catch (err) {
      console.error("Error fetching categories:", err)
      // Set fallback categories
      setCategories([
        {
          id: 1,
          name: "General Discussion",
          slug: "general",
          description: "General discussions",
          icon: "💬",
          color: "#3B82F6",
          post_count: 0,
          display_order: 1,
        },
      ])
    }
  }

  const refresh = async () => {
    setLoading(true)
    setError(null)

    await Promise.all([loadPosts(), loadCategories()])

    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel("community_posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_posts",
        },
        (payload) => {
          // Only add if it's not from the current user (to avoid duplicates)
          if (payload.new.user_id !== profile?.id) {
            // For real-time updates, we'll need to fetch the user and category data separately too
            const fetchPostData = async () => {
              try {
                // Get user data
                const { data: userData } = await supabase
                  .from("users")
                  .select("id, auth_user_id, username, full_name, avatar_url, tier")
                  .eq("id", payload.new.user_id)
                  .single()

                // Get category data
                const { data: categoryData } = await supabase
                  .from("community_categories")
                  .select("id, name, slug, description, icon, color, post_count, display_order")
                  .eq("id", payload.new.category_id)
                  .single()

                const enrichedPost = {
                  ...payload.new,
                  vote_count: payload.new.vote_count || 0,
                  comment_count: payload.new.comment_count || 0,
                  view_count: payload.new.view_count || 0,
                  is_pinned: payload.new.is_pinned || false,
                  is_featured: payload.new.is_featured || false,
                  user: userData || {
                    id: payload.new.user_id,
                    username: "Unknown User",
                    full_name: "Unknown User",
                    avatar_url: null,
                    tier: "grassroot",
                  },
                  category: categoryData || {
                    id: payload.new.category_id || 1,
                    name: "General",
                    slug: "general",
                    description: "General discussions",
                    icon: "💬",
                    color: "#3B82F6",
                    post_count: 0,
                    display_order: 1,
                  },
                  has_voted: false,
                }

                setPosts((prevPosts) => [enrichedPost, ...prevPosts])
              } catch (error) {
                console.error("Error fetching real-time post data:", error)
              }
            }

            fetchPostData()
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "community_posts",
        },
        (payload) => {
          setPosts((prevPosts) => prevPosts.map((post) => (post.id === payload.new.id ? payload.new : post)))
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "community_posts",
        },
        (payload) => {
          setPosts((prevPosts) => prevPosts.filter((post) => post.id !== payload.old.id))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, profile?.id])

  return (
    <CommunityContext.Provider
      value={{
        posts,
        categories,
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </CommunityContext.Provider>
  )
}

export function useCommunity() {
  const context = useContext(CommunityContext)
  if (context === undefined) {
    throw new Error("useCommunity must be used within a CommunityProvider")
  }
  return context
}
