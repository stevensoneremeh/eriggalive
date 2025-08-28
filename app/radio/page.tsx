"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Share2,
  Radio,
  Music,
  Headphones,
  Users,
  Pin,
  PinOff,
} from "lucide-react"
import { AnimatedRadioCharacter } from "@/components/radio/animated-radio-character"
import { EnhancedShoutOut } from "@/components/radio/enhanced-shout-out"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

interface Track {
  id: string
  title: string
  artist: string
  duration: number
  url: string
  artwork_url?: string
}

interface ShoutOut {
  id: string
  message: string
  username: string
  timestamp: Date
  type: "dedication" | "shoutout" | "request"
}

const mockTracks: Track[] = [
  {
    id: "1",
    title: "Paper Boi",
    artist: "Erigga",
    duration: 240,
    url: "/audio/paper-boi.mp3",
    artwork_url: "/images/paper-boi.jpg",
  },
  {
    id: "2",
    title: "The Erigma",
    artist: "Erigga",
    duration: 180,
    url: "/audio/the-erigma.mp3",
    artwork_url: "/images/the-erigma.jpg",
  },
  {
    id: "3",
    title: "Motivation",
    artist: "Erigga ft. Victor AD",
    duration: 200,
    url: "/audio/motivation.mp3",
    artwork_url: "/images/motivation.jpg",
  },
]

const mockShoutOuts: ShoutOut[] = [
  {
    id: "1",
    message: "Big up Erigga! This track is fire! 🔥 Much love from Warri!",
    username: "warri_boy",
    timestamp: new Date(),
    type: "shoutout",
  },
  {
    id: "2",
    message: "Can you play 'Paper Boi' next? That's my jam! Dedication to all the hustlers out there.",
    username: "hustler_queen",
    timestamp: new Date(),
    type: "dedication",
  },
  {
    id: "3",
    message: "Request: Please play some old school Erigga tracks. The classics never get old!",
    username: "old_school_fan",
    timestamp: new Date(),
    type: "request",
  },
]

export default function RadioPage() {
  const { user } = useAuth()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState([75])
  const [isMuted, setIsMuted] = useState(false)
  const [currentShoutOut, setCurrentShoutOut] = useState<ShoutOut | null>(null)
  const [listeners, setListeners] = useState(1247)
  const [dailyQuote, setDailyQuote] = useState("")
  const [isLive, setIsLive] = useState(false)
  const [liveTitle, setLiveTitle] = useState("")
  const [nextShow, setNextShow] = useState<{ title: string; time: string } | null>(null)
  const [shoutouts, setShoutouts] = useState<string[]>([])
  const [pinnedTracks, setPinnedTracks] = useState<Track[]>([])
  const [playlist, setPlaylist] = useState<Track[]>([])
  const [selectedMoodData, setSelectedMoodData] = useState<{ name: string; emoji: string }>({ name: "", emoji: "" })
  const audioRef = useRef<HTMLAudioElement>(null)
  const [theme, setTheme] = useState("dark")
  const [newShoutout, setNewShoutout] = useState("") // Declare setNewShoutout variable

  // Simulate live listener count
  useEffect(() => {
    const interval = setInterval(() => {
      setListeners((prev) => prev + Math.floor(Math.random() * 10) - 5)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Simulate shout-outs cycling
  useEffect(() => {
    const interval = setInterval(
      () => {
        const randomShoutOut = mockShoutOuts[Math.floor(Math.random() * mockShoutOuts.length)]
        setCurrentShoutOut({
          ...randomShoutOut,
          timestamp: new Date(),
        })
      },
      FEATURE_UI_FIXES_V1 ? 12000 : 8000,
    ) // Longer intervals with feature flag

    return () => clearInterval(interval)
  }, [])

  // Audio time update
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    audio.addEventListener("timeupdate", updateTime)
    return () => audio.removeEventListener("timeupdate", updateTime)
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % mockTracks.length)
    setCurrentTime(0)
  }

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + mockTracks.length) % mockTracks.length)
    setCurrentTime(0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0]
    audio.volume = newVolume / 100
    setVolume(value)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const loadRadioData = async () => {
    try {
      // Load daily quote with null guard
      const { data: quote } = await supabase
        .from("daily_quotes")
        .select("*")
        .gte("created_at", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (quote?.text) {
        setDailyQuote(quote.text)
      }

      // Load live broadcast status with null guard
      const { data: broadcast } = await supabase.from("live_broadcasts").select("*").eq("status", "live").single()

      if (broadcast?.title) {
        setIsLive(true)
        setLiveTitle(broadcast.title)
      }

      // Load next scheduled show with null guard
      const { data: nextBroadcast } = await supabase
        .from("live_broadcasts")
        .select("*")
        .eq("status", "scheduled")
        .gte("scheduled_time", new Date().toISOString())
        .order("scheduled_time", { ascending: true })
        .limit(1)
        .single()

      if (nextBroadcast?.title && nextBroadcast?.scheduled_time) {
        setNextShow({
          title: nextBroadcast.title,
          time: new Date(nextBroadcast.scheduled_time).toLocaleTimeString(),
        })
      }

      // Load recent shoutouts with null guards
      const { data: recentShoutouts } = await supabase
        .from("community_shoutouts")
        .select("message")
        .order("created_at", { ascending: false })
        .limit(10)

      if (recentShoutouts && Array.isArray(recentShoutouts)) {
        setShoutouts(recentShoutouts.map((s) => s?.message).filter(Boolean))
      }

      // Load pinned tracks for user with null guards
      if (user?.id) {
        const { data: pinned } = await supabase
          .from("user_pinned_tracks")
          .select(`
            tracks (*)
          `)
          .eq("user_id", user.id)

        if (pinned && Array.isArray(pinned)) {
          setPinnedTracks(pinned.map((p) => p?.tracks).filter(Boolean))
        }
      }
    } catch (error) {
      console.error("Error loading radio data:", error)
    }
  }

  const submitShoutout = async () => {
    if (!newShoutout?.trim() || !user?.id) return

    if (newShoutout.length > 200) {
      alert("Shoutout must be 200 characters or less")
      return
    }

    try {
      const userName = user.user_metadata?.full_name || user.email || "Anonymous"
      const shoutoutText = `${userName}: ${newShoutout.trim()}`

      // Add to local state immediately for better UX
      setShoutouts((prev) => {
        const currentShoutouts = Array.isArray(prev) ? prev : []
        return [shoutoutText, ...currentShoutouts.slice(0, 9)]
      })
      setNewShoutout("")

      // Save to database
      const { error } = await supabase.from("fan_shoutouts").insert({
        user_id: user.id,
        message: newShoutout.trim(),
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error saving shoutout:", error)
        // Remove from local state if database save failed
        setShoutouts((prev) => {
          const currentShoutouts = Array.isArray(prev) ? prev : []
          return currentShoutouts.slice(1)
        })
      }
    } catch (error) {
      console.error("Error submitting shoutout:", error)
      setShoutouts((prev) => {
        const currentShoutouts = Array.isArray(prev) ? prev : []
        return currentShoutouts.slice(1)
      })
    }
  }

  const togglePinTrack = (track: Track) => {
    // Placeholder for togglePinTrack logic
  }

  const track = mockTracks[currentTrack]

  useEffect(() => {
    loadRadioData()
  }, [user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced Shout-Out Display */}
      <EnhancedShoutOut currentShoutOut={currentShoutOut} className={FEATURE_UI_FIXES_V1 ? "md:top-24" : undefined} />

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Radio className="w-8 h-8 text-red-500 mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Erigga Live Radio
              </h1>
            </div>
            <p className="text-gray-300 text-lg">24/7 Non-stop Erigga hits and exclusive content</p>
            <div className="flex items-center justify-center mt-4 space-x-4">
              <Badge variant="secondary" className="bg-red-500/20 text-red-300 border-red-500/30">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                LIVE
              </Badge>
              <Badge variant="outline" className="text-gray-300 border-gray-600">
                <Users className="w-4 h-4 mr-1" />
                {listeners.toLocaleString()} listeners
              </Badge>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Player */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <Music className="w-5 h-5 mr-2 text-purple-400" />
                      Now Playing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Track Info */}
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-2">{track.title}</h3>
                      <p className="text-gray-300 text-lg">{track.artist}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Slider
                        value={[currentTime]}
                        max={track.duration}
                        step={1}
                        className="w-full"
                        onValueChange={(value) => {
                          const audio = audioRef.current
                          if (audio) {
                            audio.currentTime = value[0]
                            setCurrentTime(value[0])
                          }
                        }}
                      />
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(track.duration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={prevTrack}
                        className="bg-white/10 border-white/20 hover:bg-white/20"
                      >
                        <SkipBack className="w-5 h-5" />
                      </Button>

                      <Button
                        size="icon"
                        onClick={togglePlay}
                        className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                      >
                        {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={nextTrack}
                        className="bg-white/10 border-white/20 hover:bg-white/20"
                      >
                        <SkipForward className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        className="text-gray-300 hover:text-white"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                      <Slider value={volume} max={100} step={1} className="flex-1" onValueChange={handleVolumeChange} />
                      <span className="text-sm text-gray-400 w-12">{volume[0]}%</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-4">
                      <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
                        <Heart className="w-4 h-4 mr-2" />
                        Like
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-white/10 border-white/20 hover:bg-white/20"
                        onClick={submitShoutout}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Shout-out
                      </Button>
                      <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Animated Character */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardContent className="p-6 text-center">
                    <AnimatedRadioCharacter isPlaying={isPlaying} />
                    <p className="text-gray-300 mt-4">Your DJ is spinning the hottest tracks!</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Up Next */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Up Next</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockTracks.slice(1).map((track, index) => (
                      <div key={track.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded flex items-center justify-center text-white text-sm font-bold">
                          {index + 2}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{track.title}</p>
                          <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                        </div>
                        <span className="text-gray-400 text-sm">{formatTime(track.duration)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Live Stats */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <Headphones className="w-5 h-5 mr-2 text-green-400" />
                      Live Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Current Listeners</span>
                      <span className="text-white font-bold">{listeners.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Peak Today</span>
                      <span className="text-white font-bold">2,847</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Plays</span>
                      <span className="text-white font-bold">45.2K</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Uptime</span>
                      <span className="text-green-400 font-bold">99.9%</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Shoutouts */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }}>
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Shoutouts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {!Array.isArray(shoutouts) || shoutouts.length === 0 ? (
                        <p
                          className={cn(
                            "text-sm text-center py-4",
                            theme === "dark" ? "text-white/50" : "text-gray/500",
                          )}
                        >
                          No shout-outs yet. Be the first to send one!
                        </p>
                      ) : (
                        shoutouts.map((shoutout, index) => (
                          <motion.div
                            key={index}
                            className={cn(
                              "text-sm p-2 rounded-lg",
                              theme === "dark" ? "text-white/80 bg-white/5" : "text-gray-700 bg-gray-100/50",
                            )}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            {shoutout || ""}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pinned Tracks */}
              {Array.isArray(pinnedTracks) && pinnedTracks.length > 0 && (
                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}>
                  <Card
                    className={cn(
                      theme === "dark"
                        ? "glass-card"
                        : "bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-lg",
                    )}
                  >
                    <CardHeader>
                      <CardTitle
                        className={cn("flex items-center gap-2", theme === "dark" ? "text-white" : "text-gray-900")}
                      >
                        <Pin className="w-5 h-5" />
                        Pinned Tracks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {pinnedTracks.map(
                          (track) =>
                            track && (
                              <div
                                key={track.id}
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded-lg",
                                  theme === "dark" ? "bg-white/5" : "bg-gray-100/50",
                                )}
                              >
                                <img
                                  src={track.artwork_url || "/placeholder.svg"}
                                  alt={track.title || "Track"}
                                  className="w-8 h-8 rounded object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={cn(
                                      "text-sm font-medium truncate",
                                      theme === "dark" ? "text-white" : "text-gray-900",
                                    )}
                                  >
                                    {track.title || "Unknown Track"}
                                  </p>
                                  <p
                                    className={cn(
                                      "text-xs truncate",
                                      theme === "dark" ? "text-white/70" : "text-gray-600",
                                    )}
                                  >
                                    {track.artist || "Unknown Artist"}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => togglePinTrack(track)}
                                  className={cn(
                                    theme === "dark"
                                      ? "text-white/70 hover:text-white"
                                      : "text-gray-700 hover:text-gray-900",
                                  )}
                                >
                                  <PinOff className="w-4 h-4" />
                                </Button>
                              </div>
                            ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Playlist */}
              {Array.isArray(playlist) && playlist.length > 0 && (
                <motion.div
                  className="mt-12"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                >
                  <Card
                    className={cn(
                      theme === "dark"
                        ? "glass-card"
                        : "bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-lg",
                    )}
                  >
                    <CardHeader>
                      <CardTitle className={cn("text-white", theme === "dark" ? "text-white" : "text-gray-900")}>
                        {selectedMoodData.name} Playlist {selectedMoodData.emoji}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {playlist.slice(0, 6).map(
                          (track, index) =>
                            track && (
                              <motion.div
                                key={track.id}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-lg hover:cursor-pointer",
                                  theme === "dark" ? "bg-white/5" : "bg-gray-100/50",
                                )}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                onClick={() => setCurrentTrack(track)}
                              >
                                <img
                                  src={track.artwork_url || "/placeholder.svg"}
                                  alt={track.title || "Track"}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={cn(
                                      "font-medium truncate",
                                      theme === "dark" ? "text-white" : "text-gray-900",
                                    )}
                                  >
                                    {track.title || "Unknown Track"}
                                  </p>
                                  <p
                                    className={cn(
                                      "text-sm truncate",
                                      theme === "dark" ? "text-white/70" : "text-gray-600",
                                    )}
                                  >
                                    {track.artist || "Unknown Artist"}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    togglePinTrack(track)
                                  }}
                                  className={cn(
                                    theme === "dark"
                                      ? "text-white/70 hover:text-white"
                                      : "text-gray-700 hover:text-gray-900",
                                  )}
                                >
                                  {Array.isArray(pinnedTracks) && pinnedTracks.some((t) => t?.id === track.id) ? (
                                    <PinOff className="w-4 h-4" />
                                  ) : (
                                    <Pin className="w-4 h-4" />
                                  )}
                                </Button>
                              </motion.div>
                            ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={track.url}
        onEnded={nextTrack}
        onLoadedMetadata={() => {
          const audio = audioRef.current
          if (audio) {
            setCurrentTime(0)
          }
        }}
      />
    </div>
  )
}
