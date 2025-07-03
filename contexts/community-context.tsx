"use client"

import type React from "react"
import { createContext, useContext, useReducer, useCallback, useEffect } from "react"
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

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("community_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) throw error
      dispatch({ type: "SET_CATEGORIES", payload: data || [] })
    } catch (error: any) {
      console.error("Error loading categories:", error)
      dispatch({ type: "SET_ERROR", payload: error.message })
    }
  }, [supabase])

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
          const { data: userData } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()
          userInternalId = userData?.id
        }

        // --- inside loadPosts (replace everything from `let query = supabase...` down to
        // the end of the try { ... } block) ---

        // 1️⃣ build the base query (posts + author + category)
        let query = supabase
          .from("community_posts")
          .select(
            `
      *,
      user:users(id, auth_user_id, username, full_name, avatar_url, tier),
      category:community_categories(id, name, slug)
    `,
          )
          .eq("is_published", true)
          .eq("is_deleted", false)

        // 2️⃣ filters
        if (state.filters.category) {
          query = query.eq("category_id", state.filters.category)
        }
        if (state.filters.search) {
          query = query.ilike("content", `%${state.filters.search}%`)
        }

        // 3️⃣ sorting
        switch (state.filters.sort) {
          case "newest":
            query = query.order("created_at", { ascending: false })
            break
          case "oldest":
            query = query.order("created_at", { ascending: true })
            break
          case "top":
            query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
            break
        }

        // 4️⃣ pagination
        query = query.range(offset, offset + limit - 1)

        // --- run the query ---
        const { data: postsData, error } = await query
        if (error) throw error

        // 5️⃣ If the viewer is logged-in, fetch the set of post_ids they’ve already voted on
        let votedPostIds: number[] = []
        if (userInternalId && postsData && postsData.length) {
          const { data: voteRows } = await supabase
            .from("community_post_votes")
            .select("post_id")
            .eq("user_id", userInternalId)
            .in(
              "post_id",
              postsData.map((p: any) => p.id),
            )

          votedPostIds = voteRows?.map((v) => v.post_id) ?? []
        }

        // 6️⃣ decorate posts
        const postsWithVoteStatus = (postsData || []).map((post: any) => ({
          ...post,
          has_voted: votedPostIds.includes(post.id),
        }))

        // 7️⃣ push to state
        if (reset) {
          dispatch({ type: "SET_POSTS", payload: postsWithVoteStatus })
        } else {
          dispatch({ type: "ADD_POSTS", payload: postsWithVoteStatus })
        }

        dispatch({ type: "SET_HAS_MORE", payload: postsWithVoteStatus.length === limit })
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
          filter: "is_published=eq.true",
        },
        (payload) => {
          // Only add if it's not from the current user (to avoid duplicates)
          if (payload.new.user_id !== profile?.id) {
            // Fetch the full post data with relations
            supabase
              .from("community_posts")
              .select(`
                *,
                user:users!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
                category:community_categories!community_posts_category_id_fkey(id, name, slug)
              `)
              .eq("id", payload.new.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  dispatch({ type: "ADD_POST", payload: { ...data, has_voted: false } })
                }
              })
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
