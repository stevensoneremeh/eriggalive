"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@supabase/supabase-js"
import type { CartoonSeries, CartoonEpisode } from "@/types/database"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Check if we're in preview mode
const isPreviewMode =
  isBrowser && (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("v0.dev"))

// Create a Supabase client for browser usage
const getSupabaseClient = () => {
  if (isPreviewMode) {
    return createMockClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
    return createMockClient()
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Create a mock client for preview mode
const createMockClient = () => {
  return {
    from: (table: string) => ({
      select: () => ({
        order: () => ({
          then: (callback: any) => {
            setTimeout(() => {
              callback({
                data: [
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
                ],
                error: null,
              })
            }, 500)
          },
        }),
      }),
    }),
  } as any
}

interface SeriesWithEpisodes extends CartoonSeries {
  episodes: CartoonEpisode[]
}

export default function ChroniclesPage() {
  const [series, setSeries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function fetchSeries() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("cartoon_series").select().order("created_at", { ascending: false })

        if (error) throw error
        setSeries(data || [])
      } catch (err) {
        console.error("Error fetching series:", err)
        setError("Failed to load cartoon series")
      } finally {
        setLoading(false)
      }
    }

    fetchSeries()
  }, [])

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Erigga Chronicles</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[300px] rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Erigga Chronicles</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          <p className="font-medium">Error loading chronicles</p>
          <p className="text-sm">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Erigga Chronicles</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {series.map((item) => (
          <div key={item.id} className="bg-card rounded-lg overflow-hidden border">
            <div className="aspect-video relative">
              <img
                src={item.thumbnail_url || "/placeholder.svg?height=300&width=400"}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {item.total_episodes} Episodes
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-xl font-bold mb-1">{item.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{item.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded dark:bg-orange-900/30 dark:text-orange-300">
                  {item.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.release_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
