"use client"

import type React from "react"
import { createContext, useContext, useReducer, useCallback, useEffect, useState } from "react"
import type { CommunityPost, CommunityCategory } from "@/types/database"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { useAuth } from "./auth-context"

interface CommunityState {
  posts: CommunityPost[]
  categories: CommunityCategory[]
  loading: boolean
  error: string | null
  hasMore: boolean
  currentPage: number
  filters: {
    category?: number
    sort: "newest" | "oldest" | "top"
    search: string
  }
}

type CommunityAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_POSTS"; payload: CommunityPost[] }
  | { type: "ADD_POSTS"; payload: CommunityPost[] }
  | { type: "ADD_POST"; payload: CommunityPost }
  | { type: "UPDATE_POST"; payload: CommunityPost }
  | { type: "DELETE_POST"; payload: number }
  | { type: "SET_CATEGORIES"; payload: CommunityCategory[] }
  | { type: "SET_FILTERS"; payload: Partial<CommunityState["filters"]> }
  | { type: "SET_HAS_MORE"; payload: boolean }
  | { type: "SET_PAGE"; payload: number }
  | { type: "RESET_POSTS" }

const initialState: CommunityState = {
  posts: [],
  categories: [],
  loading: false,
  error: null,
  hasMore: true,
  currentPage: 1,
  filters: {
    sort: "newest",
    search: "",
  },
}

function communityReducer(state: CommunityState, action: CommunityAction): CommunityState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false }
    case "SET_POSTS":
      return { ...state, posts: action.payload, loading: false, error: null }
    case "ADD_POSTS":
      return {
        ...state,
        posts: [...state.posts, ...action.payload],
        loading: false,
        error: null,
      }
    case "ADD_POST":
      return {
        ...state,
        posts: [action.payload, ...state.posts],
        error: null,
      }
    case "UPDATE_POST":
      return {
        ...state,
        posts: state.posts.map((post) => (post.id === action.payload.id ? { ...post, ...action.payload } : post)),
      }
    case "DELETE_POST":
      return {
        ...state,
        posts: state.posts.filter((post) => post.id !== action.payload),
      }
    case "SET_CATEGORIES":
      return { ...state, categories: action.payload }
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } }
    case "SET_HAS_MORE":
      return { ...state, hasMore: action.payload }
    case "SET_PAGE":
      return { ...state, currentPage: action.payload }
    case "RESET_POSTS":
      return { ...state, posts: [], currentPage: 1, hasMore: true }
    default:
      return state
  }
}

interface CommunityContextType {
  state: CommunityState
  loadPosts: (reset?: boolean) => Promise<void>
  loadCategories: () => Promise<void>
  createPost: (postData: any) => Promise<{ success: boolean; error?: string; post?: CommunityPost }>
  updatePost: (postId: number, updates: Partial<CommunityPost>) => void
  deletePost: (postId: number) => void
  setFilters: (filters: Partial<CommunityState["filters"]>) => void
  voteOnPost: (postId: number, postCreatorId: number) => Promise<{ success: boolean; error?: string }>
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined)

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(communityReducer, initialState)
  const { user, profile } = useAuth()
  const supabase = createClientComponentClient<Database>()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CommunityCategory[]>([])
  const [posts, setPosts] = useState<CommunityPost[]>([])

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/community/categories")
      if (!res.ok) throw new Error(await res.text())
      const data: CommunityCategory[] = await res.json()
      setCategories(data)
      dispatch({ type: "SET_CATEGORIES", payload: data })
    } catch (err) {
      console.error("Error loading categories:", err)
      // fallback to a simple default to keep UI alive
      const fallbackCategories = [
        { id: 1, name: "General", slug: "general" },
        { id: 2, name: "Announcements", slug: "announcements" },
      ]
      setCategories(fallbackCategories)
      dispatch({ type: "SET_CATEGORIES", payload: fallbackCategories })
    }
  }, [])

  const loadPosts = useCallback(
    async (reset = false) => {
      if (state.loading && !reset) return

      dispatch({ type: "SET_LOADING", payload: true })
      if (reset) {
        dispatch({ type: "RESET_POSTS" })
      }

      try {
        const page = reset ? 1 : state.currentPage
        const limit = 10
        const offset = (page - 1) * limit

        // Get current user's internal ID for vote status
        let userInternalId: number | undefined
        if (user) {
          try {
            const { data: userData } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()
            userInternalId = userData?.id
          } catch (error) {
            console.warn("Could not fetch user internal ID:", error)
          }
        }

        // First, check if community_posts table exists
        let postsData: any[] = []
        try {
          // Build the base query for posts only - use minimal columns that are likely to exist
          let query = supabase
            .from("community_posts")
            .select("id, content, user_id, category_id, vote_count, created_at, updated_at")

          // Try to add filters that might exist
          try {
            query = query.eq("is_published", true)
          } catch (e) {
            // is_published column might not exist, continue without it
          }

          try {
            query = query.eq("is_deleted", false)
          } catch (e) {
            // is_deleted column might not exist, continue without it
          }

          // Apply filters
          if (state.filters.category) {
            query = query.eq("category_id", state.filters.category)
          }
          if (state.filters.search) {
            query = query.ilike("content", `%${state.filters.search}%`)
          }

          // Apply sorting
          switch (state.filters.sort) {
            case "newest":
              query = query.order("created_at", { ascending: false })
              break
            case "oldest":
              query = query.order("created_at", { ascending: true })
              break
            case "top":
              try {
                query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
              } catch (e) {
                // vote_count might not exist, fall back to created_at
                query = query.order("created_at", { ascending: false })
              }
              break
          }

          // Apply pagination
          query = query.range(offset, offset + limit - 1)

          const { data, error } = await query
          if (error) {
            if (error.code === "42P01") {
              // Table doesn't exist, return empty array
              console.warn("community_posts table is missing")
              postsData = []
            } else {
              throw error
            }
          } else {
            postsData = data || []
          }
        } catch (error: any) {
          console.error("Error fetching posts:", error)
          postsData = []
        }

        // If we have posts, fetch related data separately
        let enrichedPosts: any[] = []
        if (postsData.length > 0) {
          // Get unique user IDs and category IDs
          const userIds = [...new Set(postsData.map((post) => post.user_id).filter(Boolean))]
          const categoryIds = [...new Set(postsData.map((post) => post.category_id).filter(Boolean))]

          // Fetch users data
          let usersData: any[] = []
          if (userIds.length > 0) {
            try {
              const { data: users } = await supabase
                .from("users")
                .select("id, auth_user_id, username, full_name, avatar_url, tier")
                .in("id", userIds)
              usersData = users || []
            } catch (error) {
              console.warn("Could not fetch users data:", error)
            }
          }

          // Fetch categories data
          let categoriesData: any[] = []
          if (categoryIds.length > 0) {
            try {
              const { data: categories } = await supabase
                .from("community_categories")
                .select("id, name, slug")
                .in("id", categoryIds)
              categoriesData = categories || []
            } catch (error) {
              console.warn("Could not fetch categories data:", error)
            }
          }

          // Get vote status for current user
          let votedPostIds: number[] = []
          if (userInternalId && postsData.length > 0) {
            try {
              const { data: voteRows } = await supabase
                .from("community_post_votes")
                .select("post_id")
                .eq("user_id", userInternalId)
                .in(
                  "post_id",
                  postsData.map((p) => p.id),
                )
              votedPostIds = voteRows?.map((v) => v.post_id) ?? []
            } catch (error) {
              console.warn("Could not fetch vote data:", error)
            }
          }

          // Manually join the data
          enrichedPosts = postsData.map((post) => {
            const postUser = usersData.find((u) => u.id === post.user_id)
            const postCategory = categoriesData.find((c) => c.id === post.category_id)

            return {
              ...post,
              // Ensure we have all required fields with defaults
              vote_count: post.vote_count || 0,
              is_published: true,
              is_deleted: false,
              user: postUser || {
                id: post.user_id,
                username: "Unknown User",
                full_name: "Unknown User",
                avatar_url: null,
                tier: "grassroot",
              },
              category: postCategory || {
                id: post.category_id || 1,
                name: "General",
                slug: "general",
              },
              has_voted: votedPostIds.includes(post.id),
            }
          })
        }

        // Update state
        if (reset) {
          dispatch({ type: "SET_POSTS", payload: enrichedPosts })
        } else {
          dispatch({ type: "ADD_POSTS", payload: enrichedPosts })
        }

        dispatch({ type: "SET_HAS_MORE", payload: enrichedPosts.length === limit })
        dispatch({ type: "SET_PAGE", payload: page + 1 })
      } catch (error: any) {
        console.error("Error loading posts:", error)
        dispatch({ type: "SET_ERROR", payload: error.message })
      }
    },
    [supabase, user, state.currentPage, state.loading, state.filters],
  )

  const createPost = useCallback(
    async (postData: {
      content: string
      categoryId: number
      mediaFile?: File
    }): Promise<{ success: boolean; error?: string; post?: CommunityPost }> => {
      if (!user || !profile) {
        return { success: false, error: "You must be logged in to create posts" }
      }

      try {
        const response = await fetch("/api/community/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: postData.content,
            categoryId: postData.categoryId,
            // Handle media upload separately if needed
          }),
        })

        const result = await response.json()

        if (result.success && result.post) {
          // Add the new post to the beginning of the list
          dispatch({ type: "ADD_POST", payload: result.post })
          return { success: true, post: result.post }
        } else {
          return { success: false, error: result.error || "Failed to create post" }
        }
      } catch (error: any) {
        console.error("Error creating post:", error)
        return { success: false, error: error.message || "Failed to create post" }
      }
    },
    [user, profile],
  )

  const voteOnPost = useCallback(
    async (postId: number, postCreatorId: number): Promise<{ success: boolean; error?: string }> => {
      if (!user || !profile) {
        return { success: false, error: "You must be logged in to vote" }
      }

      try {
        const response = await fetch("/api/community/posts/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, postCreatorId }),
        })

        const result = await response.json()

        if (result.success) {
          // Update the post optimistically
          const post = state.posts.find((p) => p.id === postId)
          if (post) {
            const updatedPost = {
              ...post,
              vote_count: result.voted ? post.vote_count + 1 : post.vote_count - 1,
              has_voted: result.voted,
            }
            dispatch({ type: "UPDATE_POST", payload: updatedPost })
          }
          return { success: true }
        } else {
          return { success: false, error: result.error }
        }
      } catch (error: any) {
        console.error("Error voting on post:", error)
        return { success: false, error: error.message || "Failed to vote" }
      }
    },
    [user, profile, state.posts],
  )

  const updatePost = useCallback((postId: number, updates: Partial<CommunityPost>) => {
    dispatch({ type: "UPDATE_POST", payload: { id: postId, ...updates } as CommunityPost })
  }, [])

  const deletePost = useCallback((postId: number) => {
    dispatch({ type: "DELETE_POST", payload: postId })
  }, [])

  const setFilters = useCallback((filters: Partial<CommunityState["filters"]>) => {
    dispatch({ type: "SET_FILTERS", payload: filters })
  }, [])

  const refresh = useCallback(() => {
    setLoading(true)
    Promise.all([loadCategories(), loadPosts()]).finally(() => setLoading(false))
  }, [loadCategories, loadPosts])

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Reload posts when filters change
  useEffect(() => {
    loadPosts(true)
  }, [state.filters])

  // Set up real-time subscriptions
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
                  .select("id, name, slug")
                  .eq("id", payload.new.category_id)
                  .single()

                const enrichedPost = {
                  ...payload.new,
                  vote_count: payload.new.vote_count || 0,
                  is_published: true,
                  is_deleted: false,
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
                  },
                  has_voted: false,
                }

                dispatch({ type: "ADD_POST", payload: enrichedPost })
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
          dispatch({ type: "UPDATE_POST", payload: payload.new as CommunityPost })
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
          dispatch({ type: "DELETE_POST", payload: payload.old.id })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, profile?.id])

  const contextValue: CommunityContextType = {
    state,
    loadPosts,
    loadCategories,
    createPost,
    updatePost,
    deletePost,
    setFilters,
    voteOnPost,
  }

  return <CommunityContext.Provider value={contextValue}>{children}</CommunityContext.Provider>
}

export function useCommunity() {
  const context = useContext(CommunityContext)
  if (context === undefined) {
    throw new Error("useCommunity must be used within a CommunityProvider")
  }
  return context
}
