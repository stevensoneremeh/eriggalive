"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Radio,
  Users,
  MessageCircle,
  Heart,
  Flame,
  Brain,
  Zap,
  Shuffle,
  Pin,
  PinOff,
  Calendar,
  Clock,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { AnimatedRadioCharacter } from "@/components/radio/animated-radio-character"

interface Track {
  id: string
  title: string
  artist: string
  artwork_url: string
  duration_ms: number
  mood_category: string
  is_pinned?: boolean
}

interface MoodCategory {
  id: string
  name: string
  emoji: string
  color: string
  gradient: string
  description: string
  icon: React.ReactNode
}

const moodCategories: MoodCategory[] = [
  {
    id: "turn-up",
    name: "Turn Up",
    emoji: "🔥",
    color: "from-red-500 to-orange-500",
    gradient: "bg-gradient-to-br from-red-500/20 to-orange-500/20",
    description: "Hype / Party Vibes",
    icon: <Flame className="w-8 h-8" />,
  },
  {
    id: "reflective",
    name: "Reflective",
    emoji: "🧠",
    color: "from-purple-500 to-blue-500",
    gradient: "bg-gradient-to-br from-purple-500/20 to-blue-500/20",
    description: "Street Wisdom",
    icon: <Brain className="w-8 h-8" />,
  },
  {
    id: "love-emotions",
    name: "Love & Emotions",
    emoji: "❤️",
    color: "from-pink-500 to-rose-500",
    gradient: "bg-gradient-to-br from-pink-500/20 to-rose-500/20",
    description: "Heart & Soul",
    icon: <Heart className="w-8 h-8" />,
  },
  {
    id: "motivation",
    name: "Motivation",
    emoji: "💪",
    color: "from-green-500 to-emerald-500",
    gradient: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
    description: "Hustle & Grind",
    icon: <Zap className="w-8 h-8" />,
  },
  {
    id: "freestyle",
    name: "Freestyle",
    emoji: "🎭",
    color: "from-yellow-500 to-amber-500",
    gradient: "bg-gradient-to-br from-yellow-500/20 to-amber-500/20",
    description: "Mixed Vibes",
    icon: <Shuffle className="w-8 h-8" />,
  },
]

export default function RadioPage() {
  const { isAuthenticated, user } = useAuth()
  const supabase = createClient()
  const audioRef = useRef<HTMLAudioElement>(null)

  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(70)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Radio state
  const [selectedMood, setSelectedMood] = useState<string>("turn-up")
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [playlist, setPlaylist] = useState<Track[]>([])
  const [pinnedTracks, setPinnedTracks] = useState<Track[]>([])
  const [isLive, setIsLive] = useState(false)
  const [liveTitle, setLiveTitle] = useState("")
  const [listenerCount, setListenerCount] = useState(247)
  const [dailyQuote, setDailyQuote] = useState("")
  const [shoutouts, setShoutouts] = useState<string[]>([])
  const [newShoutout, setNewShoutout] = useState("")
  const [nextShow, setNextShow] = useState<{ title: string; time: string } | null>(null)

  // Visual state
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [backgroundTheme, setBackgroundTheme] = useState("turn-up")

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    loadRadioData()
    setupRealtimeSubscription()
  }, [])

  useEffect(() => {
    if (selectedMood) {
      loadMoodPlaylist(selectedMood)
      setBackgroundTheme(selectedMood)
    }
  }, [selectedMood])

  const loadRadioData = async () => {
    try {
      // Load daily quote
      const { data: quote } = await supabase
        .from("daily_quotes")
        .select("*")
        .gte("created_at", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (quote) {
        setDailyQuote(quote.text)
      }

      // Load live broadcast status
      const { data: broadcast } = await supabase.from("live_broadcasts").select("*").eq("status", "live").single()

      if (broadcast) {
        setIsLive(true)
        setLiveTitle(broadcast.title)
      }

      // Load next scheduled show
      const { data: nextBroadcast } = await supabase
        .from("live_broadcasts")
        .select("*")
        .eq("status", "scheduled")
        .gte("scheduled_time", new Date().toISOString())
        .order("scheduled_time", { ascending: true })
        .limit(1)
        .single()

      if (nextBroadcast) {
        setNextShow({
          title: nextBroadcast.title,
          time: new Date(nextBroadcast.scheduled_time).toLocaleTimeString(),
        })
      }

      // Load recent shoutouts
      const { data: recentShoutouts } = await supabase
        .from("community_shoutouts")
        .select("message")
        .order("created_at", { ascending: false })
        .limit(10)

      if (recentShoutouts) {
        setShoutouts(recentShoutouts.map((s) => s.message))
      }

      // Load pinned tracks for user
      if (user) {
        const { data: pinned } = await supabase
          .from("user_pinned_tracks")
          .select(`
            tracks (*)
          `)
          .eq("user_id", user.id)

        if (pinned) {
          setPinnedTracks(pinned.map((p) => p.tracks).filter(Boolean))
        }
      }
    } catch (error) {
      console.error("Error loading radio data:", error)
    }
  }

  const loadMoodPlaylist = async (mood: string) => {
    try {
      const { data: tracks } = await supabase
        .from("tracks")
        .select("*")
        .eq("mood_category", mood)
        .order("created_at", { ascending: false })
        .limit(20)

      if (tracks) {
        setPlaylist(tracks)
        if (tracks.length > 0 && !currentTrack) {
          setCurrentTrack(tracks[0])
        }
      }
    } catch (error) {
      console.error("Error loading playlist:", error)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("radio-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_broadcasts" }, (payload) => {
        if (payload.new?.status === "live") {
          setIsLive(true)
          setLiveTitle(payload.new.title)
        } else if (payload.old?.status === "live") {
          setIsLive(false)
          setLiveTitle("")
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_shoutouts" }, (payload) => {
        if (payload.new) {
          setShoutouts((prev) => [payload.new.message, ...prev.slice(0, 9)])
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  const togglePlayPause = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        await audioRef.current.play()
      }
    } catch (error) {
      console.error("Playback error:", error)
    }
  }

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId)
  }

  const togglePinTrack = async (track: Track) => {
    if (!user) return

    const isPinned = pinnedTracks.some((t) => t.id === track.id)

    try {
      if (isPinned) {
        await supabase.from("user_pinned_tracks").delete().eq("user_id", user.id).eq("track_id", track.id)
        setPinnedTracks((prev) => prev.filter((t) => t.id !== track.id))
      } else {
        await supabase.from("user_pinned_tracks").insert({
          user_id: user.id,
          track_id: track.id,
        })
        setPinnedTracks((prev) => [...prev, track])
      }
    } catch (error) {
      console.error("Error toggling pin:", error)
    }
  }

  const sendShoutout = async () => {
    if (!newShoutout.trim() || !user) return

    try {
      await supabase.from("community_shoutouts").insert({
        user_id: user.id,
        message: newShoutout.trim(),
      })
      setNewShoutout("")
    } catch (error) {
      console.error("Error sending shoutout:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const selectedMoodData = moodCategories.find((m) => m.id === selectedMood) || moodCategories[0]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/10">
        <Card className="glass-card p-8 text-center max-w-md">
          <CardContent>
            <Radio className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to access Erigga Radio and enjoy mood-based playlists.
            </p>
            <Button asChild className="w-full">
              <a href="/login?redirect=/radio">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen transition-all duration-1000", selectedMoodData.gradient)}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-5">
          {/* Lagos Skyline Silhouettes */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Floating Graffiti Elements */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className={cn("absolute rounded-lg", selectedMoodData.color.replace("from-", "bg-"))}
              style={{
                width: `${20 + i * 10}px`,
                height: `${20 + i * 10}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      x: [0, 50, -50, 0],
                      y: [0, -30, 30, 0],
                      rotate: [0, 180, 360],
                      opacity: [0.1, 0.3, 0.1],
                    }
              }
              transition={{
                duration: 15 + i * 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-black mb-4 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent"
            style={{
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              fontFamily: "Impact, Arial Black, sans-serif",
              letterSpacing: "0.1em",
            }}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    textShadow: [
                      "2px 2px 4px rgba(0,0,0,0.5)",
                      "4px 4px 8px rgba(255,0,0,0.3)",
                      "2px 2px 4px rgba(0,0,0,0.5)",
                    ],
                  }
            }
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          >
            ERIGGA RADIO
          </motion.h1>
          <motion.p
            className="text-2xl md:text-3xl font-bold text-white/90 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Vibes for Every Mood
          </motion.p>

          {/* Live Indicator */}
          <AnimatePresence>
            {isLive && (
              <motion.div
                className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <motion.div
                  className="w-3 h-3 bg-white rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                />
                LIVE: {liveTitle}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Daily Quote */}
        {dailyQuote && (
          <motion.div
            className="glass-card rounded-2xl p-6 mb-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-lg italic text-white/90">"{dailyQuote}"</p>
            <p className="text-sm text-white/70 mt-2">- Erigga</p>
          </motion.div>
        )}

        {/* Mood Selector Grid */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Choose Your Vibe</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {moodCategories.map((mood, index) => (
              <motion.div
                key={mood.id}
                className={cn(
                  "glass-card rounded-2xl p-6 cursor-pointer transition-all duration-300",
                  "hover:scale-105 hover:shadow-2xl",
                  selectedMood === mood.id ? "ring-4 ring-white/50 scale-105" : "",
                )}
                onClick={() => handleMoodSelect(mood.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={prefersReducedMotion ? {} : { y: -5 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                    mood.color.replace("from-", "bg-").replace("to-", ""),
                  )}
                >
                  {mood.icon}
                </div>
                <h3 className="text-lg font-bold text-white text-center mb-2">{mood.name}</h3>
                <p className="text-sm text-white/70 text-center">{mood.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Player */}
          <div className="lg:col-span-2">
            <motion.div
              className="glass-card rounded-2xl p-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              {/* Cassette/Vinyl Player Interface */}
              <div className="relative mb-8">
                <div className="aspect-square max-w-md mx-auto">
                  {/* Vinyl Record */}
                  <motion.div
                    className="relative w-full h-full rounded-full bg-gradient-to-br from-gray-900 to-black shadow-2xl overflow-hidden"
                    animate={isPlaying && !prefersReducedMotion ? { rotate: 360 } : {}}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    {/* Record Grooves */}
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute border border-gray-700 rounded-full"
                        style={{
                          width: `${90 - i * 10}%`,
                          height: `${90 - i * 10}%`,
                          top: `${5 + i * 5}%`,
                          left: `${5 + i * 5}%`,
                        }}
                      />
                    ))}

                    {/* Center Label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                        <img
                          src={currentTrack?.artwork_url || "/placeholder.svg?height=80&width=80&query=erigga logo"}
                          alt="Album Art"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Tonearm */}
                  <motion.div
                    className="absolute -top-4 right-8 w-2 h-32 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full origin-bottom"
                    animate={isPlaying ? { rotate: -25 } : { rotate: 25 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="absolute bottom-0 w-4 h-4 bg-gray-500 rounded-full -left-1" />
                  </motion.div>
                </div>

                {/* Beat Visualizer */}
                {isPlaying && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {[...Array(7)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={cn(
                          "w-2 rounded-full",
                          selectedMoodData.color.replace("from-", "bg-").replace("to-", ""),
                        )}
                        animate={
                          prefersReducedMotion
                            ? {}
                            : {
                                height: [8, 32, 8],
                                opacity: [0.5, 1, 0.5],
                              }
                        }
                        transition={{
                          duration: 0.8,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.1,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {currentTrack?.title || "Select a mood to start"}
                </h2>
                <p className="text-lg text-white/70">{currentTrack?.artist || "Erigga Radio"}</p>
                <Badge className={cn("mt-2", selectedMoodData.color)}>
                  {selectedMoodData.name} {selectedMoodData.emoji}
                </Badge>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-6 mb-6">
                <Button variant="ghost" size="lg" className="text-white hover:text-white/80">
                  <SkipBack className="w-6 h-6" />
                </Button>

                <Button
                  size="lg"
                  className="rounded-full w-16 h-16 bg-white text-black hover:bg-white/90"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>

                <Button variant="ghost" size="lg" className="text-white hover:text-white/80">
                  <SkipForward className="w-6 h-6" />
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => setIsMuted(!isMuted)} className="text-white">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[volume]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setVolume(value[0])}
                  className="flex-1"
                />
                <span className="text-sm text-white/70 w-12">{volume}%</span>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Broadcast Card */}
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Radio className="w-5 h-5" />
                    Live Broadcast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLive ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <motion.div
                          className="w-3 h-3 bg-red-500 rounded-full"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                        />
                        <span className="text-white font-bold">LIVE NOW</span>
                      </div>
                      <p className="text-white/90">{liveTitle}</p>
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Users className="w-4 h-4" />
                        <span>{listenerCount} listeners</span>
                      </div>
                    </div>
                  ) : nextShow ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-white/70">
                        <Calendar className="w-4 h-4" />
                        <span>Next Show</span>
                      </div>
                      <p className="text-white font-bold">{nextShow.title}</p>
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Clock className="w-4 h-4" />
                        <span>{nextShow.time}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/70">No live broadcasts scheduled</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Community Shout-outs */}
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <MessageCircle className="w-5 h-5" />
                    Fan Shout-outs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newShoutout}
                      onChange={(e) => setNewShoutout(e.target.value)}
                      placeholder="Send a shout-out..."
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      onKeyPress={(e) => e.key === "Enter" && sendShoutout()}
                    />
                    <Button onClick={sendShoutout} size="sm" className="bg-white text-black hover:bg-white/90">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Animated Radio Character */}
                  <div className="flex justify-center py-4">
                    <AnimatedRadioCharacter
                      isPlaying={isPlaying}
                      isLive={isLive}
                      shoutouts={shoutouts}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {shoutouts.map((shoutout, index) => (
                      <motion.div
                        key={index}
                        className="text-sm text-white/80 p-2 bg-white/5 rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {shoutout}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pinned Tracks */}
            {pinnedTracks.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}>
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Pin className="w-5 h-5" />
                      Pinned Tracks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {pinnedTracks.map((track) => (
                        <div key={track.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                          <img
                            src={track.artwork_url || "/placeholder.svg"}
                            alt={track.title}
                            className="w-8 h-8 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{track.title}</p>
                            <p className="text-xs text-white/70 truncate">{track.artist}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePinTrack(track)}
                            className="text-white/70 hover:text-white"
                          >
                            <PinOff className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Current Playlist */}
        {playlist.length > 0 && (
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">
                  {selectedMoodData.name} Playlist {selectedMoodData.emoji}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playlist.slice(0, 6).map((track, index) => (
                    <motion.div
                      key={track.id}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => setCurrentTrack(track)}
                    >
                      <img
                        src={track.artwork_url || "/placeholder.svg"}
                        alt={track.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{track.title}</p>
                        <p className="text-sm text-white/70 truncate">{track.artist}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePinTrack(track)
                        }}
                        className="text-white/70 hover:text-white"
                      >
                        {pinnedTracks.some((t) => t.id === track.id) ? (
                          <PinOff className="w-4 h-4" />
                        ) : (
                          <Pin className="w-4 h-4" />
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src="/placeholder-audio.mp3" type="audio/mpeg" />
      </audio>
    </div>
  )
}
