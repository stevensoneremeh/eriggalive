"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context" // Keep your existing auth
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Download, Star, TrendingUp, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FreebieItem {
  id: number
  title: string
  description: string
  file_url: string
  thumbnail_url?: string
  vote_count: number
  download_count: number
  created_at: string
  user_has_voted: boolean
  type: "track" | "video" | "image" | "document"
}

export default function FreebiesRoom() {
  const [freebies, setFreebies] = useState<FreebieItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth() // Use your existing auth
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadFreebies()
  }, [])

  const loadFreebies = async () => {
    try {
      const { data: freebiesData } = await supabase
        .from("freebies")
        .select("*")
        .eq("is_active", true)
        .order("vote_count", { ascending: false })

      if (freebiesData) {
        // Check which items current user has voted on
        let userVotes: number[] = []
        if (profile) {
          const { data: votesData } = await supabase
            .from("freebie_votes")
            .select("freebie_id")
            .eq("user_id", profile.id)

          userVotes = votesData?.map((v) => v.freebie_id) || []
        }

        const formattedFreebies = freebiesData.map((item) => ({
          ...item,
          user_has_voted: userVotes.includes(item.id),
        }))

        setFreebies(formattedFreebies)
      }
    } catch (error) {
      console.error("Error loading freebies:", error)
      toast({
        title: "Error",
        description: "Failed to load freebies",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const voteOnFreebie = async (freebieId: number) => {
    if (!profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on freebies",
        variant: "destructive",
      })
      return
    }

    try {
      // Check if already voted
      const { data: existingVote } = await supabase
        .from("freebie_votes")
        .select("id")
        .eq("freebie_id", freebieId)
        .eq("user_id", profile.id)
        .single()

      if (existingVote) {
        // Remove vote
        await supabase.from("freebie_votes").delete().eq("freebie_id", freebieId).eq("user_id", profile.id)

        // Update freebie vote count
        await supabase.rpc("decrement_freebie_votes", { freebie_id: freebieId })

        toast({
          title: "Vote removed",
          description: "Your vote has been removed",
        })
      } else {
        // Add vote
        await supabase.from("freebie_votes").insert({
          freebie_id: freebieId,
          user_id: profile.id,
        })

        // Update freebie vote count
        await supabase.rpc("increment_freebie_votes", { freebie_id: freebieId })

        toast({
          title: "Voted!",
          description: "Your vote has been counted",
        })
      }

      loadFreebies() // Reload to update counts
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to vote",
        variant: "destructive",
      })
    }
  }

  const downloadFreebie = async (freebieId: number, fileUrl: string, title: string) => {
    try {
      // Increment download count
      await supabase.rpc("increment_freebie_downloads", { freebie_id: freebieId })

      // Create download link
      const link = document.createElement("a")
      link.href = fileUrl
      link.download = title
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download started",
        description: "Your download has begun",
      })

      loadFreebies() // Reload to update download counts
    } catch (error) {
      console.error("Error downloading:", error)
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "track":
        return "🎵"
      case "video":
        return "🎬"
      case "image":
        return "🖼️"
      case "document":
        return "📄"
      default:
        return "📁"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading freebies...</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              Discovering exclusive content for you
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center mb-4">
            <Star className="h-8 w-8 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Freebies Room
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Vote on exclusive free content and downloads</p>
          <div className="flex justify-center gap-6 mt-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {freebies.length} Items Available
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Community Voted
            </span>
          </div>
        </div>

        {/* Freebies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freebies.map((freebie) => (
            <Card
              key={freebie.id}
              className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{getTypeIcon(freebie.type)}</span>
                  <Badge variant="secondary" className="text-xs">
                    {freebie.type.toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{freebie.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{freebie.description}</p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {freebie.vote_count} votes
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {freebie.download_count} downloads
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => voteOnFreebie(freebie.id)}
                    className={`flex items-center gap-2 flex-1 ${
                      freebie.user_has_voted
                        ? "text-red-500 border-red-500 hover:text-red-600 hover:border-red-600"
                        : "hover:text-red-500 hover:border-red-500"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${freebie.user_has_voted ? "fill-current" : ""}`} />
                    {freebie.user_has_voted ? "Voted" : "Vote"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => downloadFreebie(freebie.id, freebie.file_url, freebie.title)}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {freebies.length === 0 && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No freebies available</h3>
              <p className="text-gray-500 dark:text-gray-400">Check back later for exclusive free content!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}