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
  MessageCircle,
  Heart,
  Flame,
  Brain,
  Zap,
  Shuffle,
  Pin,
  PinOff,
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
import { useTheme } from "next-themes"

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

interface NextShow {
  title: string
  time: string
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

const ERIGGA_AUDIO_URL =
  "https://yor5bfsajnljnrjg.public.blob.vercel-storage.com/Erigga-Ft-Great-Adamz-Around-9-%28TrendyBeatz.com%29.mp3"

export default function RadioPage() {
  const { isAuthenticated, user } = useAuth()
  const { theme } = useTheme()
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
  const [nextShow, setNextShow] = useState<NextShow | null>(null)

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
      // Create a mock track for the selected mood using the provided audio
      const mockTrack: Track = {
        id: `${mood}-track`,
        title: "Around 9",
        artist: "Erigga Ft. Great Adamz",
        artwork_url: "/erigga-album-cover.png",
        duration_ms: 180000, // 3 minutes placeholder
        mood_category: mood,
        is_pinned: false,
      }

      setPlaylist([mockTrack])
      setCurrentTrack(mockTrack)

      // Update audio source
      if (audioRef.current) {
        audioRef.current.src = ERIGGA_AUDIO_URL
        audioRef.current.load()
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
          setShoutouts((prev) => [payload.new.message, ...prev.slice(0, 9)]) // Keep only 10 most recent
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

  const submitShoutout = async () => {
    if (!newShoutout.trim() || !user) return

    if (newShoutout.length > 200) {
      alert("Shoutout must be 200 characters or less")
      return
    }

    try {
      const shoutoutText = `${user.user_metadata?.full_name || user.email}: ${newShoutout.trim()}`

      // Add to local state immediately for better UX
      setShoutouts((prev) => [shoutoutText, ...prev.slice(0, 9)]) // Keep only 10 most recent
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
        setShoutouts((prev) => prev.slice(1))
      }
    } catch (error) {
      console.error("Error submitting shoutout:", error)
      setShoutouts((prev) => prev.slice(1))
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
    <div
      className={cn(
        "min-h-screen transition-all duration-1000",
        theme === "dark"
          ? selectedMoodData.gradient
          : `bg-gradient-to-br from-gray-50 to-gray-100 dark:${selectedMoodData.gradient}`,
      )}
    >
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-5 dark:opacity-5">
          {/* Lagos Skyline Silhouettes */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Floating Graffiti Elements */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "absolute rounded-lg",
                theme === "dark" ? selectedMoodData.color.replace("from-", "bg-") : "bg-gray-300/30",
              )}
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
            className={cn(
              "text-6xl md:text-8xl font-black mb-4 bg-gradient-to-r bg-clip-text text-transparent",
              theme === "dark" ? "from-white via-gray-200 to-white" : "from-gray-900 via-gray-700 to-gray-900",
            )}
            style={{
              textShadow: theme === "dark" ? "2px 2px 4px rgba(0,0,0,0.5)" : "2px 2px 4px rgba(255,255,255,0.5)",
              fontFamily: "Impact, Arial Black, sans-serif",
              letterSpacing: "0.1em",
            }}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    textShadow:
                      theme === "dark"
                        ? [
                            "2px 2px 4px rgba(0,0,0,0.5)",
                            "4px 4px 8px rgba(255,0,0,0.3)",
                            "2px 2px 4px rgba(0,0,0,0.5)",
                          ]
                        : [
                            "2px 2px 4px rgba(255,255,255,0.5)",
                            "4px 4px 8px rgba(255,0,0,0.2)",
                            "2px 2px 4px rgba(255,255,255,0.5)",
                          ],
                  }
            }
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          >
            ERIGGA RADIO
          </motion.h1>
          <motion.p
            className={cn("text-2xl md:text-3xl font-bold mb-2", theme === "dark" ? "text-white/90" : "text-gray-800")}
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
            className={cn(
              "glass-card rounded-2xl p-6 mb-8 text-center",
              theme === "dark"
                ? "bg-white/10 backdrop-blur-md border-white/20"
                : "bg-white/80 backdrop-blur-md border-gray-200/50 shadow-lg",
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className={cn("text-lg italic", theme === "dark" ? "text-white/90" : "text-gray-800")}>"{dailyQuote}"</p>
            <p className={cn("text-sm mt-2", theme === "dark" ? "text-white/70" : "text-gray-600")}>- Erigga</p>
          </motion.div>
        )}

        {/* Mood Selector Grid */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className={cn("text-3xl font-bold mb-6 text-center", theme === "dark" ? "text-white" : "text-gray-900")}>
            Choose Your Vibe
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {moodCategories.map((mood, index) => (
              <motion.div
                key={mood.id}
                className={cn(
                  "rounded-2xl p-6 cursor-pointer transition-all duration-300",
                  "hover:scale-105 hover:shadow-2xl",
                  selectedMood === mood.id ? "ring-4 scale-105" : "",
                  theme === "dark"
                    ? "glass-card ring-white/50"
                    : "bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-lg ring-gray-400/50",
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
                <h3
                  className={cn(
                    "text-lg font-bold text-center mb-2",
                    theme === "dark" ? "text-white" : "text-gray-900",
                  )}
                >
                  {mood.name}
                </h3>
                <p className={cn("text-sm text-center", theme === "dark" ? "text-white/70" : "text-gray-600")}>
                  {mood.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Player */}
          <div className="lg:col-span-2">
            <motion.div
              className={cn(
                "rounded-2xl p-8",
                theme === "dark" ? "glass-card" : "bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-xl",
              )}
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

                {/* Track Info */}
                <div className="text-center mb-8">
                  <h2 className={cn("text-2xl font-bold mb-2", theme === "dark" ? "text-white" : "text-gray-900")}>
                    {currentTrack?.title || "Select a mood to start"}
                  </h2>
                  <p className={cn("text-lg", theme === "dark" ? "text-white/70" : "text-gray-600")}>
                    {currentTrack?.artist || "Erigga Radio"}
                  </p>
                  <Badge className={cn("mt-2", selectedMoodData.color)}>
                    {selectedMoodData.name} {selectedMoodData.emoji}
                  </Badge>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-6 mb-6">
                  <Button
                    variant="ghost"
                    size="lg"
                    className={cn(
                      theme === "dark" ? "text-white hover:text-white/80" : "text-gray-700 hover:text-gray-900",
                    )}
                  >
                    <SkipBack className="w-6 h-6" />
                  </Button>

                  <Button
                    size="lg"
                    className={cn(
                      "rounded-full w-16 h-16",
                      theme === "dark"
                        ? "bg-white text-black hover:bg-white/90"
                        : "bg-gray-900 text-white hover:bg-gray-800",
                    )}
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    className={cn(
                      theme === "dark" ? "text-white hover:text-white/80" : "text-gray-700 hover:text-gray-900",
                    )}
                  >
                    <SkipForward className="w-6 h-6" />
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                    className={cn(theme === "dark" ? "text-white" : "text-gray-700")}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Slider
                    value={[volume]}
                    max={100}
                    step={1}
                    onValueChange={(value) => setVolume(value[0])}
                    className="flex-1"
                  />
                  <span className={cn("text-sm w-12", theme === "dark" ? "text-white/70" : "text-gray-600")}>
                    {volume}%
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Enhanced Community Shout-outs Section */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
              <Card
                className={cn(
                  "relative overflow-hidden",
                  theme === "dark"
                    ? "glass-card border-2 border-purple-500/30 shadow-2xl shadow-purple-500/10"
                    : "bg-white/95 backdrop-blur-md border-2 border-purple-200/50 shadow-xl shadow-purple-100/20",
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 opacity-50 animate-pulse" />

                <CardHeader className="relative z-10 pb-4">
                  <CardTitle
                    className={cn(
                      "flex items-center gap-3 text-xl font-bold",
                      theme === "dark" ? "text-white" : "text-gray-900",
                    )}
                  >
                    <div className="relative">
                      <MessageCircle className="w-6 h-6" />
                      {shoutouts.length > 0 && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        />
                      )}
                    </div>
                    Fan Shout-outs
                    {shoutouts.length > 0 && (
                      <motion.div
                        className="ml-auto bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        {shoutouts.length}
                      </motion.div>
                    )}
                  </CardTitle>
                  <p className={cn("text-sm", theme === "dark" ? "text-white/70" : "text-gray-600")}>
                    Share your vibes with the community! 🎵
                  </p>
                </CardHeader>

                <CardContent className="relative z-10 space-y-6">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newShoutout}
                        onChange={(e) => setNewShoutout(e.target.value)}
                        placeholder="What's on your mind? Share your vibe..."
                        className={cn(
                          "flex-1 h-12 text-base",
                          theme === "dark"
                            ? "bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-purple-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-purple-400",
                        )}
                        onKeyPress={(e) => e.key === "Enter" && submitShoutout()}
                        maxLength={200}
                      />
                      <Button
                        onClick={submitShoutout}
                        size="lg"
                        className={cn(
                          "px-6 h-12 font-semibold transition-all duration-200",
                          theme === "dark"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25"
                            : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25",
                        )}
                        disabled={!newShoutout.trim()}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className={cn("text-xs", theme === "dark" ? "text-white/50" : "text-gray-500")}>
                        💬 Your message will appear on the radio character!
                      </div>
                      <div
                        className={cn(
                          "text-xs font-medium",
                          newShoutout.length > 180
                            ? "text-red-500"
                            : newShoutout.length > 150
                              ? "text-yellow-500"
                              : theme === "dark"
                                ? "text-white/50"
                                : "text-gray-500",
                        )}
                      >
                        {newShoutout.length}/200
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-200/20">
                    <div className="flex justify-center">
                      <AnimatedRadioCharacter
                        isPlaying={isPlaying}
                        isLive={isLive}
                        shoutouts={shoutouts}
                        className="w-full"
                      />
                    </div>
                    <div className="text-center mt-4">
                      <p className={cn("text-sm font-medium", theme === "dark" ? "text-white/80" : "text-gray-700")}>
                        {shoutouts.length > 0
                          ? "Your messages are live on air! 📻"
                          : "Be the first to send a shout-out! 🎤"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className={cn("font-semibold", theme === "dark" ? "text-white" : "text-gray-900")}>
                        Recent Messages
                      </h4>
                      {shoutouts.length > 0 && (
                        <motion.div
                          className="text-xs text-purple-500 font-medium"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        >
                          ● LIVE
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {shoutouts.length === 0 ? (
                        <div
                          className={cn(
                            "text-center py-8 rounded-lg border-2 border-dashed",
                            theme === "dark"
                              ? "text-white/50 border-white/20 bg-white/5"
                              : "text-gray-500 border-gray-300 bg-gray-50/50",
                          )}
                        >
                          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium mb-1">No shout-outs yet!</p>
                          <p className="text-xs">Be the first to share your vibe 🎵</p>
                        </div>
                      ) : (
                        shoutouts.map((shoutout, index) => (
                          <motion.div
                            key={index}
                            className={cn(
                              "p-3 rounded-lg border-l-4 border-purple-400 relative overflow-hidden",
                              theme === "dark"
                                ? "text-white/90 bg-white/10 backdrop-blur-sm"
                                : "text-gray-800 bg-white/80 backdrop-blur-sm shadow-sm",
                            )}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-50" />
                            <div className="relative z-10">
                              <div className="flex items-start gap-2">
                                <div className="text-purple-500 text-sm">💬</div>
                                <p className="text-sm leading-relaxed flex-1">{shoutout}</p>
                              </div>
                              <div className={cn("text-xs mt-1", theme === "dark" ? "text-white/40" : "text-gray-500")}>
                                Just now
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
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
            <Card
              className={cn(
                theme === "dark" ? "glass-card" : "bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-lg",
              )}
            >
              <CardHeader>
                <CardTitle className={cn("text-white", theme === "dark" ? "text-white" : "text-gray-900")}>
                  {selectedMoodData.name} Playlist {selectedMoodData.emoji}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playlist.slice(0, 6).map((track, index) => (
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
                        alt={track.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium truncate", theme === "dark" ? "text-white" : "text-gray-900")}>
                          {track.title}
                        </p>
                        <p className={cn("text-sm truncate", theme === "dark" ? "text-white/70" : "text-gray-600")}>
                          {track.artist}
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
                          theme === "dark" ? "text-white/70 hover:text-white" : "text-gray-700 hover:text-gray-900",
                        )}
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

        {/* Next Scheduled Show */}
        {nextShow && (
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6 }}
          >
            <Card
              className={cn(
                theme === "dark" ? "glass-card" : "bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-lg",
              )}
            >
              <CardHeader>
                <CardTitle className={cn("text-white", theme === "dark" ? "text-white" : "text-gray-900")}>
                  Next Scheduled Show
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className={cn("text-sm", theme === "dark" ? "text-white/70" : "text-gray-600")}>
                      {nextShow.time}
                    </span>
                  </div>
                  <p className={cn("text-sm", theme === "dark" ? "text-white/70" : "text-gray-600")}>
                    {nextShow.title}
                  </p>
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
        onError={(e) => console.error("[v0] Audio playback error:", e)}
        onLoadedMetadata={() => console.log("[v0] Audio loaded successfully")}
      >
        <source src={ERIGGA_AUDIO_URL} type="audio/mpeg" />
      </audio>
    </div>
  )
}
