"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Clock, Eye, Star, Calendar, Film, Heart } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import type { CartoonSeries, CartoonEpisode, UserEpisodeProgress } from "@/types/database"

interface SeriesWithEpisodes extends CartoonSeries {
  episodes: CartoonEpisode[]
}

export default function ChroniclesPage() {
  const [selectedSeries, setSelectedSeries] = useState<SeriesWithEpisodes | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<CartoonEpisode | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [series, setSeries] = useState<SeriesWithEpisodes[]>([])
  const [userProgress, setUserProgress] = useState<Record<number, UserEpisodeProgress>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile, isAuthenticated } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchSeries()
    if (user && profile) {
      fetchUserProgress()
    }
  }, [user, profile])

  const fetchSeries = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: seriesData, error: seriesError } = await supabase
        .from("cartoon_series")
        .select("*")
        .order("created_at", { ascending: false })

      if (seriesError) throw seriesError

      // Fetch episodes for each series
      const seriesWithEpisodes = await Promise.all(
        (seriesData || []).map(async (series) => {
          const { data: episodes, error: episodesError } = await supabase
            .from("cartoon_episodes")
            .select("*")
            .eq("series_id", series.id)
            .order("episode_number", { ascending: true })

          if (episodesError) throw episodesError

          return {
            ...series,
            episodes: episodes || [],
          }
        }),
      )

      setSeries(seriesWithEpisodes)
    } catch (error) {
      console.error("Error fetching series:", error)
      setError("Failed to load series. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProgress = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase.from("user_episode_progress").select("*").eq("user_id", profile.id)

      if (error) throw error

      const progressMap = (data || []).reduce(
        (acc, progress) => {
          acc[progress.episode_id] = progress
          return acc
        },
        {} as Record<number, UserEpisodeProgress>,
      )

      setUserProgress(progressMap)
    } catch (error) {
      console.error("Error fetching user progress:", error)
      // Don't set an error state here as this is not critical
    }
  }

  const updateProgress = async (episodeId: number, progress: number) => {
    if (!profile) return

    try {
      // Update local state first for immediate feedback
      setUserProgress((prev) => ({
        ...prev,
        [episodeId]: {
          user_id: profile.id,
          episode_id: episodeId,
          progress_percentage: progress,
          completed: progress >= 90,
          last_watched: new Date().toISOString(),
        } as UserEpisodeProgress,
      }))

      const { error } = await supabase.from("user_episode_progress").upsert({
        user_id: profile.id,
        episode_id: episodeId,
        progress_percentage: progress,
        completed: progress >= 90,
        last_watched: new Date().toISOString(),
      })

      if (error) throw error
    } catch (error) {
      console.error("Error updating progress:", error)
    }
  }

  const filteredSeries = series.filter((series) => {
    if (activeTab === "all") return true
    if (activeTab === "ongoing") return series.status === "ongoing"
    if (activeTab === "completed") return series.status === "completed"
    if (activeTab === "upcoming") return series.status === "upcoming"
    return series.category === activeTab
  })

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  const canWatchEpisode = (episode: CartoonEpisode) => {
    if (!episode.is_released) return false
    // Add premium gating logic here if needed
    return true
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500 mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading Chronicles...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            <div className="bg-red-500/10 p-4 rounded-lg mb-4">
              <p className="text-red-500">{error}</p>
            </div>
            <Button onClick={fetchSeries} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-street text-4xl md:text-6xl text-gradient mb-4">ERIGGA CHRONICLES</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Animated series bringing Erigga's stories to life. From street adventures to studio sessions, experience the
            Paper Boi journey in cartoon form.
          </p>
        </div>

        {/* Series Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-6 bg-card/50 border border-lime-500/20">
            <TabsTrigger value="all" className="data-[state=active]:bg-lime-500 data-[state=active]:text-teal-900">
              All Series
            </TabsTrigger>
            <TabsTrigger value="ongoing" className="data-[state=active]:bg-lime-500 data-[state=active]:text-teal-900">
              Ongoing
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-lime-500 data-[state=active]:text-teal-900"
            >
              Completed
            </TabsTrigger>
            <TabsTrigger value="comedy" className="data-[state=active]:bg-lime-500 data-[state=active]:text-teal-900">
              Comedy
            </TabsTrigger>
            <TabsTrigger value="drama" className="data-[state=active]:bg-lime-500 data-[state=active]:text-teal-900">
              Drama
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-lime-500 data-[state=active]:text-teal-900">
              Upcoming
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Series Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredSeries.map((series) => (
            <Card
              key={series.id}
              className="bg-card/50 border-lime-500/20 hover:border-lime-500/40 transition-all group cursor-pointer harkonnen-card-style"
              onClick={() => setSelectedSeries(series)}
            >
              <CardHeader className="p-0">
                <div className="relative">
                  <img
                    src={series.thumbnail_url || "/placeholder.svg?height=300&width=400"}
                    alt={series.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />

                  {/* Status Badge */}
                  <Badge
                    className={`absolute top-2 left-2 ${
                      series.status === "ongoing"
                        ? "bg-lime-500 text-teal-900"
                        : series.status === "completed"
                          ? "bg-teal-700 text-lime-300"
                          : "bg-teal-900 text-lime-500"
                    }`}
                  >
                    {series.status.toUpperCase()}
                  </Badge>

                  {/* Category Badge */}
                  <Badge className="absolute top-2 right-2 bg-lime-500 text-teal-900">
                    {series.category.toUpperCase()}
                  </Badge>

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-teal-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-t-lg">
                    <div className="bg-lime-500 rounded-full p-4">
                      <Play className="h-8 w-8 text-teal-900 fill-teal-900" />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-xl mb-2">{series.title}</h3>
                    <p className="text-sm text-muted-foreground">{series.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Film className="h-4 w-4 text-lime-500" />
                        {series.total_episodes} episodes
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-lime-300" />
                        {formatViews(series.total_views)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-lime-500 fill-lime-500" />
                      <span>{series.rating}</span>
                    </div>
                  </div>

                  {/* Release Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Released: {new Date(series.release_date).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Series Detail Modal */}
        {selectedSeries && (
          <Dialog open={!!selectedSeries} onOpenChange={() => setSelectedSeries(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto harkonnen-card-style">
              <DialogHeader>
                <DialogTitle className="text-2xl font-street text-gradient">{selectedSeries.title}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Series Info */}
                <div className="space-y-4">
                  <img
                    src={selectedSeries.thumbnail_url || "/placeholder.svg?height=300&width=400"}
                    alt={selectedSeries.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />

                  <div className="space-y-2">
                    <p className="text-muted-foreground">{selectedSeries.description}</p>

                    <div className="flex items-center gap-4 text-sm">
                      <Badge className="bg-lime-500 text-teal-900">{selectedSeries.status.toUpperCase()}</Badge>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-lime-500 fill-lime-500" />
                        {selectedSeries.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatViews(selectedSeries.total_views)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Episodes List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Episodes ({selectedSeries.total_episodes})</h3>

                  {selectedSeries.episodes.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedSeries.episodes.map((episode, index) => (
                        <Card
                          key={episode.id}
                          className={`bg-background/50 border-lime-500/20 hover:border-lime-500/40 transition-all cursor-pointer ${
                            !canWatchEpisode(episode) ? "opacity-50" : ""
                          }`}
                          onClick={() => canWatchEpisode(episode) && setSelectedEpisode(episode)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-lime-500/20 rounded-lg flex items-center justify-center">
                                {episode.is_released ? (
                                  <Play className="h-6 w-6 text-lime-500" />
                                ) : (
                                  <Clock className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold">
                                    Ep {episode.episode_number}: {episode.title}
                                  </h4>
                                  <span className="text-xs text-muted-foreground">{episode.duration}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{episode.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {formatViews(episode.views)}
                                  </span>
                                  {userProgress[episode.id] && (
                                    <span className="text-xs text-lime-500">
                                      {Math.round(userProgress[episode.id].progress_percentage)}% watched
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Episodes coming soon...</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Episode Player Modal */}
        {selectedEpisode && (
          <Dialog open={!!selectedEpisode} onOpenChange={() => setSelectedEpisode(null)}>
            <DialogContent className="max-w-5xl harkonnen-card-style">
              <DialogHeader>
                <DialogTitle>{selectedEpisode.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Video Player Placeholder */}
                <div className="aspect-video bg-teal-900 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg">Video Player</p>
                    <p className="text-sm text-gray-400">Duration: {selectedEpisode.duration}</p>
                    <Button
                      className="mt-4 bg-lime-500 hover:bg-lime-600 text-teal-900"
                      onClick={() => updateProgress(selectedEpisode.id, 100)}
                    >
                      Mark as Watched
                    </Button>
                  </div>
                </div>

                {/* Episode Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{selectedEpisode.title}</h3>
                    <p className="text-muted-foreground">{selectedEpisode.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4 mr-1" />
                      Like
                    </Button>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {formatViews(selectedEpisode.views)}
                    </span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Stats Section */}
        <section className="py-12 px-4 bg-gradient-to-r from-teal-900/20 to-lime-500/10 rounded-lg">
          <div className="text-center">
            <h2 className="font-street text-3xl text-gradient mb-8">CHRONICLES STATS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-lime-500">{series.length}</div>
                <div className="text-sm text-muted-foreground">Active Series</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-lime-300">
                  {series.reduce((acc, s) => acc + s.total_episodes, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Episodes</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-lime-500">
                  {formatViews(series.reduce((acc, s) => acc + s.total_views, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-lime-300">
                  {series.length > 0
                    ? (series.reduce((acc, s) => acc + s.rating, 0) / series.length).toFixed(1)
                    : "0.0"}
                </div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
