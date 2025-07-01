"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import type { CartoonSeries, CartoonEpisode } from "@/types/database"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface SeriesWithEpisodes extends CartoonSeries {
  episodes: CartoonEpisode[]
}

export default function ChroniclesPage() {
  const [series, setSeries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile } = useAuth()
  const supabase = createClient()

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
