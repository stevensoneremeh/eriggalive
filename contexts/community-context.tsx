"use client"

import type React from "react"
import { createContext, useContext, useReducer, useCallback, useEffect } from "react"
import type { CommunityPost, CommunityCategory } from "@/types/database"
import { createClientSupabase } from "@/lib/supabase/client"
import { useAuth } from "./auth-context"

/* -------------------------------------------------------------------------- */
/*                                State & Types                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                               Context Setup                                */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                            Provider Implementation                          */
/* -------------------------------------------------------------------------- */

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(communityReducer, initialState)
  const { user, profile } = useAuth()
  const supabase = createClientSupabase()

  /* ------------------------- Category Loading ---------------------------- */

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/community/categories")
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to fetch categories")
      }
      const data = await res.json()
      dispatch({ type: "SET_CATEGORIES", payload: data.categories || [] })
    } catch (err) {
      console.error("Error loading categories:", err)
      // Set fallback categories
      dispatch({
        type: "SET_CATEGORIES",
        payload: [
          {
            id: 1,
            name: "General Discussion",
            slug: "general",
            description: "General discussions",
            icon: "💬",
            color: "#3B82F6",
            display_order: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ] as CommunityCategory[],
      })
    }
  }, [])

  /* --------------------------- Posts Loading ---------------------------- */

  const loadPosts = useCallback(
    async (reset = false) => {
      if (state.loading && !reset) return

      dispatch({ type: "SET_LOADING", payload: true })
      if (reset) dispatch({ type: "RESET_POSTS" })

      try {
        const res = await fetch("/api/community/posts")
        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(errorText || "Failed to fetch posts")
        }

        const data = await res.json()
        const posts = data.posts || []

        if (reset) {
          dispatch({ type: "SET_POSTS", payload: posts })
        } else {
          dispatch({ type: "ADD_POSTS", payload: posts })
        }

        dispatch({ type: "SET_HAS_MORE", payload: posts.length === 20 })
        dispatch({ type: "SET_PAGE", payload: state.currentPage + 1 })
      } catch (err: any) {
        console.error("Error loading posts:", err)
        dispatch({ type: "SET_ERROR", payload: err.message || "Failed to load posts" })
      }
    },
    [state.currentPage, state.loading],
  )

  /* --------------------------- Post Creation ---------------------------- */

  const createPost = useCallback(
    async (postData: { content: string; categoryId: number }) => {
      if (!user || !profile) return { success: false, error: "You must be logged in to create posts" }

      try {
        const res = await fetch("/api/community/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: postData.content,
            category_id: postData.categoryId,
          }),
        })

        const result = await res.json()

        if (result.success && result.post) {
          dispatch({ type: "ADD_POST", payload: result.post })
          return { success: true, post: result.post }
        }
        return { success: false, error: result.error || "Failed to create post" }
      } catch (err: any) {
        console.error("Error creating post:", err)
        return { success: false, error: err.message }
      }
    },
    [user, profile],
  )

  /* --------------------------- Voting ---------------------------- */

  const voteOnPost = useCallback(
    async (postId: number, postCreatorId: number) => {
      if (!user || !profile) return { success: false, error: "You must be logged in to vote" }

      try {
        const res = await fetch("/api/community/posts/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, postCreatorId }),
        })
        const result = await res.json()

        if (result.success) {
          const post = state.posts.find((p) => p.id === postId)
          if (post) {
            dispatch({
              type: "UPDATE_POST",
              payload: {
                ...post,
                vote_count: result.voted ? post.vote_count + 1 : post.vote_count - 1,
              } as CommunityPost,
            })
          }
          return { success: true }
        }
        return { success: false, error: result.error }
      } catch (err: any) {
        console.error("Error voting:", err)
        return { success: false, error: err.message }
      }
    },
    [user, profile, state.posts],
  )

  /* --------------------- Misc Update/Delete Helpers -------------------- */

  const updatePost = useCallback((postId: number, updates: Partial<CommunityPost>) => {
    dispatch({ type: "UPDATE_POST", payload: { id: postId, ...updates } as CommunityPost })
  }, [])

  const deletePost = useCallback((postId: number) => {
    dispatch({ type: "DELETE_POST", payload: postId })
  }, [])

  const setFilters = useCallback(
    (filters: Partial<CommunityState["filters"]>) => dispatch({ type: "SET_FILTERS", payload: filters }),
    [],
  )

  /* ------------------------- Initial Load ------------------------- */

  useEffect(() => {
    loadCategories()
    loadPosts(true)
  }, [loadCategories, loadPosts])

  useEffect(() => {
    loadPosts(true)
  }, [state.filters, loadPosts])

  /* ---------------------------- Context Value -------------------------- */

  const value: CommunityContextType = {
    state,
    loadPosts,
    loadCategories,
    createPost,
    updatePost,
    deletePost,
    setFilters,
    voteOnPost,
  }

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>
}

/* -------------------------------------------------------------------------- */
/*                               Hook Export                                  */
/* -------------------------------------------------------------------------- */

export function useCommunity() {
  const ctx = useContext(CommunityContext)
  if (ctx === undefined) {
    throw new Error("useCommunity must be used within a CommunityProvider")
  }
  return ctx
}
