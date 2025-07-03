"use client"

import type React from "react"
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useState,
} from "react"
import type { CommunityPost, CommunityCategory } from "@/types/database"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
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

function communityReducer(
  state: CommunityState,
  action: CommunityAction,
): CommunityState {
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
        posts: state.posts.map((post) =>
          post.id === action.payload.id ? { ...post, ...action.payload } : post,
        ),
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
  createPost: (
    postData: any,
  ) => Promise<{ success: boolean; error?: string; post?: CommunityPost }>
  updatePost: (postId: number, updates: Partial<CommunityPost>) => void
  deletePost: (postId: number) => void
  setFilters: (filters: Partial<CommunityState["filters"]>) => void
  voteOnPost: (
    postId: number,
    postCreatorId: number,
  ) => Promise<{ success: boolean; error?: string }>
}

const CommunityContext = createContext<CommunityContextType | undefined>(
  undefined,
)

/* -------------------------------------------------------------------------- */
/*                            Provider Implementation                          */
/* -------------------------------------------------------------------------- */

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(communityReducer, initialState)
  const { user, profile } = useAuth()
  const supabase = createClientComponentClient<Database>()

  /* ------------------------- Category Loading ---------------------------- */

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/community/categories")
      if (!res.ok) throw new Error(await res.text())
      const data: CommunityCategory[] = await res.json()
      dispatch({ type: "SET_CATEGORIES", payload: data })
    } catch (err) {
      console.error("Error loading categories:", err)
      dispatch({
        type: "SET_CATEGORIES",
        payload: [
          { id: 1, name: "General", slug: "general" },
          { id: 2, name: "Announcements", slug: "announcements" },
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
        const page = reset ? 1 : state.currentPage
        const limit = 10
        const offset = (page - 1) * limit

        /* ---------- Base post query (minimal, resilient) ---------- */
        let query = supabase
          .from("community_posts")
          .select(
            "id, content, user_id, category_id, vote_count, created_at, updated_at",
          )

        /* Optional columns (ignore if missing) */
        try {
          query = query.eq("is_published", true)
        } catch {}
        try {
          query = query.eq("is_deleted", false)
        } catch {}

        /* Filters */
        if (state.filters.category) query = query.eq("category_id", state.filters.category)
        if (state.filters.search)
          query = query.ilike("content", `%${state.filters.search}%`)

        /* Sorting */
        switch (state.filters.sort) {
          case "newest":
            query = query.order("created_at", { ascending: false })
            break
          case "oldest":
            query = query.order("created_at", { ascending: true })
            break
          case "top":
            try {
              query = query.order("vote_count", { ascending: false })
            } catch {
              query = query.order("created_at", { ascending: false })
            }
            break
        }

        /* Pagination */
        query = query.range(offset, offset + limit - 1)

        const { data: postsData, error } = await query
        if (error) {
          if (error.code === "42P01") {
            console.warn("community_posts table is missing")
            dispatch({ type: "SET_POSTS", payload: [] })
            return
          }
          throw error
        }

        /* ---------- Enrich posts with user & category ---------- */
        const userIds = [...new Set(postsData.map((p) => p.user_id))]
        const categoryIds = [...new Set(postsData.map((p) => p.category_id))]

        const [{ data: users }, { data: categories }] = await Promise.all([
          supabase
            .from("users")
            .select("id, username, avatar_url, tier")
            .in("id", userIds),
          supabase
            .from("community_categories")
            .select("id, name, slug")
            .in("id", categoryIds),
        ])

        const usersMap = new Map((users ?? []).map((u) => [u.id, u]))
        const categoriesMap = new Map(
          (categories ?? []).map((c) => [c.id, c]),
        )

        const enriched = (postsData ?? []).map((p) => ({
          ...p,
          user: usersMap.get(p.user_id),
          category: categoriesMap.get(p.category_id),
        }))

        if (reset) {
          dispatch({ type: "SET_POSTS", payload: enriched })
        } else {
          dispatch({ type: "ADD_POSTS", payload: enriched })
        }

        dispatch({
          type: "SET_HAS_MORE",
          payload: enriched.length === limit,
        })
        dispatch({ type: "SET_PAGE", payload: page + 1 })
      } catch (err: any) {
        console.error("Error loading posts:", err)
        dispatch({ type: "SET_ERROR", payload: err.message })
      }
    },
    [supabase, state.currentPage, state.loading, state.filters],
  )

  /* --------------------------- Post Creation ---------------------------- */

  const createPost = useCallback(
    async (postData: { content: string; categoryId: number }) => {
      if (!user || !profile)
        return { success: false, error: "You must be logged in to create posts" }

      try {
        const res = await fetch("/api/community/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: postData.content,
            categoryId: postData.categoryId,
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
      if (!user || !profile)
        return { success: false, error: "You must be logged in to vote" }

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
                vote_count: result.voted
                  ? post.vote_count + 1
                  : post.vote_count - 1,
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
    (filters: Partial<CommunityState["filters"]>) =>
      dispatch({ type: "SET_FILTERS", payload: filters }),
    [],
  )

  /* ------------------------- Initial Load & RT ------------------------- */

  useEffect(() => {
    loadCategories()
    loadPosts(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadPosts(true)
  }, [state.filters]) // reload when filters change

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
