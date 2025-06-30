"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Download, Music, Video, ImageIcon, Gift } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FreebieItem {
  id: number
  title: string
  description: string
  type: "music" | "video" | "image" | "other"
  file_url: string
  thumbnail_url?: string
  vote_count: number
  download_count: number
  created_at: string
  user: {
    id: number
    username: string
    full_name: string
    tier: string
    avatar_url?: string
  }
  user_has_voted: boolean
}

const TYPE_ICONS = {
  music: <Music className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  other: <Gift className="h-5 w-5" />,
}

const TYPE_COLORS = {
  music: "bg-green-500",
  video: "bg-red-500",
  image: "bg-blue-500",
  other: "bg-purple-500",
}

export default function FreebiesRoom() {
  const [freebies, setFreebies] = useState<FreebieItem[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadFreebies()
  }, [])

  const loadFreebies = async () => {
    try {
      setLoading(true)

      // Load freebies with user data
      const { data: freebiesData, error } = await supabase
        .from("freebies")
        .select(`
          *,
          user:users!freebies_user_id_fkey (
            id, username, full_name, tier, avatar_url
          )
        `)
        .eq("is_active", true)
        .order("vote_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error loading freebies:", error)
        throw error
      }

      if (freebiesData) {
        // Check which items current user has voted on
        let userVotes: number[] = []
        if (profile?.id) {
          const { data: votesData, error: votesError } = await supabase
            .from("freebie_votes")
            .select("freebie_id")
            .eq("user_id", profile.id)

          if (!votesError && votesData) {
            userVotes = votesData.map((v) => v.freebie_id)
          }
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
        description: "Failed to load freebies. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const voteOnFreebie = async (freebieId: number) => {
    if (!profile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on freebies.",
        variant: "destructive",
      })
      return
    }

    try {
      // Check if already voted
      const { data: existingVote, error: voteCheckError } = await supabase
        .from("freebie_votes")
        .select("id")
        .eq("freebie_id", freebieId)
        .eq("user_id", profile.id)
        .maybeSingle()

      if (voteCheckError && voteCheckError.code !== "PGRST116") {
        throw voteCheckError
      }

      if (existingVote) {
        // Remove vote
        const { error: deleteError } = await supabase
          .from("freebie_votes")
          .delete()
          .eq("freebie_id", freebieId)
          .eq("user_id", profile.id)

        if (deleteError) throw deleteError

        // Update vote count
        const { error: updateError } = await supabase
          .from("freebies")
          .update({ vote_count: supabase.raw("GREATEST(vote_count - 1, 0)") })
          .eq("id", freebieId)

        if (updateError) throw updateError

        toast({
          title: "Vote Removed",
          description: "Your vote has been removed.",
        })
      } else {
        // Add vote
        const { error: insertError } = await supabase.from("freebie_votes").insert({
          freebie_id: freebieId,
          user_id: profile.id,
        })

        if (insertError) throw insertError

        // Update vote count
        const { error: updateError } = await supabase
          .from("freebies")
          .update({ vote_count: supabase.raw("vote_count + 1") })
          .eq("id", freebieId)

        if (updateError) throw updateError

        toast({
          title: "Vote Added",
          description: "Thanks for voting!",
        })
      }

      await loadFreebies() // Reload to update counts
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive",
      })
    }
  }

  const downloadFreebie = async (freebie: FreebieItem) => {
    try {
      // Increment download count
      const { error: updateError } = await supabase
        .from("freebies")
        .update({ download_count: supabase.raw("download_count + 1") })
        .eq("id", freebie.id)

      if (updateError) {
        console.error("Error updating download count:", updateError)
      }

      // Create download link
      const link = document.createElement("a")
      link.href = freebie.file_url
      link.download = freebie.title
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download Started",
        description: `Downloading ${freebie.title}...`,
      })

      await loadFreebies() // Reload to update download count
    } catch (error) {
      console.error("Error downloading:", error)
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading freebies...</p>
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
            <Gift className="h-12 w-12 text-yellow-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Freebies Room
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Vote on and download free content shared by the community
          </p>
        </div>

        {/* Freebies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freebies.map((freebie) => (
            <Card
              key={freebie.id}
              className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-full ${TYPE_COLORS[freebie.type]} text-white`}>
                    {TYPE_ICONS[freebie.type]}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {freebie.type}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{freebie.title}</CardTitle>
              </CardHeader>

              <CardContent>
                {/* Thumbnail */}
                {freebie.thumbnail_url && (
                  <div className="mb-4">
                    <img
                      src={freebie.thumbnail_url || "/placeholder.svg"}
                      alt={freebie.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{freebie.description}</p>

                {/* User Info */}
                <div className="flex items-center space-x-2 mb-4">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={freebie.user?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{freebie.user?.username?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600 dark:text-gray-400">by @{freebie.user?.username}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{freebie.vote_count} votes</span>
                  <span>{freebie.download_count} downloads</span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => voteOnFreebie(freebie.id)}
                    className={`flex items-center space-x-1 ${
                      freebie.user_has_voted ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500"
                    }`}
                    disabled={!profile}
                  >
                    <Heart className={`h-4 w-4 ${freebie.user_has_voted ? "fill-current" : ""}`} />
                    <span>{freebie.vote_count}</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => downloadFreebie(freebie)}
                    className="flex items-center space-x-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {freebies.length === 0 && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No freebies available</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Check back later for free content shared by the community!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
