import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Mock data for preview mode
const mockData = {
  cartoon_series: [
    {
      id: 1,
      title: "Paper Boi Chronicles",
      description: "Follow Erigga's journey from the streets to stardom",
      thumbnail_url: "/placeholder.svg?height=300&width=400",
      release_date: "2023-01-15",
      status: "ongoing",
      category: "drama",
      total_episodes: 12,
      total_views: 1500000,
      rating: 4.8,
      created_at: "2023-01-01T00:00:00Z",
    },
    {
      id: 2,
      title: "Warri Adventures",
      description: "Comedy series based on Erigga's experiences in Warri",
      thumbnail_url: "/placeholder.svg?height=300&width=400",
      release_date: "2023-03-20",
      status: "completed",
      category: "comedy",
      total_episodes: 8,
      total_views: 980000,
      rating: 4.6,
      created_at: "2023-03-01T00:00:00Z",
    },
    {
      id: 3,
      title: "Studio Sessions",
      description: "Behind the scenes of Erigga's music creation process",
      thumbnail_url: "/placeholder.svg?height=300&width=400",
      release_date: "2023-06-10",
      status: "ongoing",
      category: "documentary",
      total_episodes: 5,
      total_views: 750000,
      rating: 4.9,
      created_at: "2023-06-01T00:00:00Z",
    },
    {
      id: 4,
      title: "The Erigma Saga",
      description: "Animated adaptation of Erigga's album concepts",
      thumbnail_url: "/placeholder.svg?height=300&width=400",
      release_date: "2023-09-05",
      status: "upcoming",
      category: "music",
      total_episodes: 0,
      total_views: 250000,
      rating: 0,
      created_at: "2023-08-15T00:00:00Z",
    },
  ],
  cartoon_episodes: [
    {
      id: 1,
      series_id: 1,
      title: "The Beginning",
      description: "Erigga's early days in the music industry",
      episode_number: 1,
      duration: "22:15",
      thumbnail_url: "/placeholder.svg?height=200&width=300",
      video_url: "#",
      is_released: true,
      release_date: "2023-01-15",
      views: 350000,
      created_at: "2023-01-01T00:00:00Z",
    },
    {
      id: 2,
      series_id: 1,
      title: "The Struggle",
      description: "Overcoming challenges in the Nigerian music scene",
      episode_number: 2,
      duration: "24:30",
      thumbnail_url: "/placeholder.svg?height=200&width=300",
      video_url: "#",
      is_released: true,
      release_date: "2023-01-22",
      views: 320000,
      created_at: "2023-01-08T00:00:00Z",
    },
    {
      id: 3,
      series_id: 1,
      title: "The Breakthrough",
      description: "Erigga's first major hit and rising fame",
      episode_number: 3,
      duration: "23:45",
      thumbnail_url: "/placeholder.svg?height=200&width=300",
      video_url: "#",
      is_released: true,
      release_date: "2023-01-29",
      views: 380000,
      created_at: "2023-01-15T00:00:00Z",
    },
    {
      id: 4,
      series_id: 2,
      title: "Warri No Dey Carry Last",
      description: "Comedic adventures in the streets of Warri",
      episode_number: 1,
      duration: "20:15",
      thumbnail_url: "/placeholder.svg?height=200&width=300",
      video_url: "#",
      is_released: true,
      release_date: "2023-03-20",
      views: 290000,
      created_at: "2023-03-01T00:00:00Z",
    },
    {
      id: 5,
      series_id: 2,
      title: "Area Boys",
      description: "Erigga navigates local street politics",
      episode_number: 2,
      duration: "21:30",
      thumbnail_url: "/placeholder.svg?height=200&width=300",
      video_url: "#",
      is_released: true,
      release_date: "2023-03-27",
      views: 275000,
      created_at: "2023-03-08T00:00:00Z",
    },
  ],
  community_categories: [
    {
      id: 1,
      name: "General Discussion",
      slug: "general",
      description: "General discussions about Erigga and his music",
      display_order: 1,
      created_at: "2023-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "Music Analysis",
      slug: "music",
      description: "Deep dives into Erigga's lyrics and music",
      display_order: 2,
      created_at: "2023-01-01T00:00:00Z",
    },
    {
      id: 3,
      name: "Fan Art",
      slug: "art",
      description: "Share your Erigga-inspired artwork",
      display_order: 3,
      created_at: "2023-01-01T00:00:00Z",
    },
    {
      id: 4,
      name: "Events",
      slug: "events",
      description: "Discussions about Erigga's concerts and appearances",
      display_order: 4,
      created_at: "2023-01-01T00:00:00Z",
    },
  ],
}

// Function to check if we're in preview mode
export function isPreviewMode() {
  // In a real app, this would check for a specific environment variable or context
  // For now, we'll just check if we're running in development mode
  return process.env.NODE_ENV === "development"
}

// Create a Supabase client for server-side operations
export function createServerSupabaseClient() {
  // If in preview mode, return a mock client
  if (isPreviewMode()) {
    return createMockClient()
  }

  // Otherwise, create a real Supabase client
  const supabaseUrl = process.env.SUPABASE_URL || ""
  const supabaseKey = process.env.SUPABASE_ANON_KEY || ""

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Create a mock Supabase client for preview mode
function createMockClient() {
  return {
    from: (table: string) => ({
      select: (columns = "*") => ({
        eq: (column: string, value: any) => ({
          order: (column: string, { ascending = true }: { ascending: boolean }) => ({
            async then(callback: (result: { data: any[]; error: null }) => void) {
              // Simulate API delay
              await new Promise((resolve) => setTimeout(resolve, 500))

              // Return mock data based on the table
              if (table === "cartoon_series") {
                callback({
                  data: mockData.cartoon_series,
                  error: null,
                })
              } else if (table === "cartoon_episodes") {
                const filteredEpisodes = mockData.cartoon_episodes.filter((episode) => episode.series_id === value)
                callback({
                  data: filteredEpisodes,
                  error: null,
                })
              } else if (table === "community_categories") {
                callback({
                  data: mockData.community_categories,
                  error: null,
                })
              } else {
                callback({
                  data: [],
                  error: null,
                })
              }
            },
          }),
          async then(callback: (result: { data: any[]; error: null }) => void) {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 500))

            // Return mock data based on the table and filter
            if (table === "cartoon_episodes") {
              const filteredEpisodes = mockData.cartoon_episodes.filter((episode) => episode.series_id === value)
              callback({
                data: filteredEpisodes,
                error: null,
              })
            } else {
              callback({
                data: [],
                error: null,
              })
            }
          },
        }),
        order: (column: string, { ascending = true }: { ascending: boolean }) => ({
          async then(callback: (result: { data: any[]; error: null }) => void) {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 500))

            // Return mock data based on the table
            if (table === "cartoon_series") {
              callback({
                data: mockData.cartoon_series,
                error: null,
              })
            } else if (table === "cartoon_episodes") {
              callback({
                data: mockData.cartoon_episodes,
                error: null,
              })
            } else if (table === "community_categories") {
              callback({
                data: mockData.community_categories,
                error: null,
              })
            } else {
              callback({
                data: [],
                error: null,
              })
            }
          },
        }),
      }),
      upsert: (data: any) => ({
        async then(callback: (result: { data: any; error: null }) => void) {
          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 500))

          callback({
            data: { ...data, id: Date.now() },
            error: null,
          })
        },
      }),
    }),
    auth: {
      getSession: async () => ({
        data: { session: null },
        error: null,
      }),
      getUser: async () => ({
        data: { user: null },
        error: null,
      }),
    },
  }
}

// Re-export from our utility file
import { createAdminSupabaseClient, getServerClient, createMockServerClient } from "../supabase-utils"

export { createAdminSupabaseClient, getServerClient, createMockServerClient }

// Helper to check if we're in a production environment
export const isProduction = () => {
  return process.env.NODE_ENV === "production"
}

// Helper to check if we're in a development environment
export const isDevelopment = () => {
  return process.env.NODE_ENV === "development"
}
