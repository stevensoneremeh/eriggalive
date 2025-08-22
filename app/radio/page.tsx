"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Radio,
  Users,
  Clock,
  Heart,
  Zap,
  Brain,
  Dumbbell,
  Mic,
  MessageCircle,
  Pin,
  PinOff,
  Shuffle,
  Repeat,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import EriggaRadio from "@/components/erigga-radio"

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

interface LiveBroadcast {
  id: string
  title: string
  description: string
  is_live: boolean
  listener_count: number
  scheduled_time?: string
}

interface ShoutOut {
  id: string
  username: string
  message: string
  timestamp: string
}

const moodCategories: MoodCategory[] = [
  {
    id: "turn-up",
    name: "Turn Up",
    emoji: "🔥",
    color: "from-red-500 to-orange-500",
    gradient: "bg-gradient-to-br from-red-500/20 to-orange-500/20",
    description: "Hype / Party vibes",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: "reflective",
    name: "Reflective",
    emoji: "🧠",
    color: "from-purple-500 to-indigo-500",
    gradient: "bg-gradient-to-br from-purple-500/20 to-indigo-500/20",
    description: "Street Wisdom",
    icon: <Brain className="w-6 h-6" />,
  },
  {
    id: "love-emotions",
    name: "Love & Emotions",
    emoji: "❤️",
    color: "from-pink-500 to-rose-500",
    gradient: "bg-gradient-to-br from-pink-500/20 to-rose-500/20",
    description: "Heartfelt vibes",
    icon: <Heart className="w-6 h-6" />,
  },
  {
    id: "motivation",
    name: "Motivation & Hustle",
    emoji: "💪",
    color: "from-green-500 to-emerald-500",
    gradient: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
    description: "Grind time",
    icon: <Dumbbell className="w-6 h-6" />,
  },
  {
    id: "freestyle",
    name: "Freestyle / Mixed",
    emoji: "🎭",
    color: "from-yellow-500 to-amber-500",
    gradient: "bg-gradient-to-br from-yellow-500/20 to-amber-500/20",
    description: "Mixed Vibes",
    icon: <Mic className="w-6 h-6" />,
  },
]

const dailyQuotes = [
  "Success na journey, no be destination - Erigga",
  "Make you hustle hard, but make you smart pass - Paper Boi",
  "Street wisdom dey teach wetin school no fit teach - Erigga",
  "Your grind today na your glory tomorrow - Paper Boi",
  "Stay focused, stay hungry, stay humble - Erigga",
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
  const [isLoading, setIsLoading] = useState(false)

  // Radio state
  const [selectedMood, setSelectedMood] = useState<string>("turn-up")
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [playlist, setPlaylist] = useState<Track[]>([])
  const [pinnedTracks, setPinnedTracks] = useState<Track[]>([])
  const [isShuffled, setIsShuffled] = useState(false)
  const [isRepeating, setIsRepeating] = useState(false)

  // Live broadcast state
  const [liveBroadcast, setLiveBroadcast] = useState<LiveBroadcast | null>(null)
  const [shoutOuts, setShoutOuts] = useState<ShoutOut[]>([])
  const [newShoutOut, setNewShoutOut] = useState("")

  // UI state
  const [dailyQuote, setDailyQuote] = useState("")
  const [showChat, setShowChat] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Initialize daily quote
  useEffect(() => {
    const randomQuote = dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)]
    setDailyQuote(randomQuote)
  }, [])

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadMoodPlaylist(selectedMood)
      loadLiveBroadcast()
      loadShoutOuts()
      loadPinnedTracks()
    }
  }, [isAuthenticated, selectedMood])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => playNextTrack()

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  const loadMoodPlaylist = async (mood: string) => {
    try {
      const { data: tracks } = await supabase
        .from("radio_tracks")
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
      // Fallback to mock data
      const mockTracks: Track[] = [
        {
          id: "1",
          title: "Paper Boi",
          artist: "Erigga",
          artwork_url: "/erigga-album-cover.png",
          duration_ms: 240000,
          mood_category: mood,
        },
        {
          id: "2",
          title: "Street Motivation",
          artist: "Erigga ft. Victor AD",
          artwork_url: "/street-music-album.png",
          duration_ms: 210000,
          mood_category: mood,
        },
        {
          id: "3",
          title: "Warri Anthem",
          artist: "Erigga",
          artwork_url: "/erigga-album-cover.png",
          duration_ms: 225000,
          mood_category: mood,
        },
        {
          id: "4",
          title: "Life Philosophy",
          artist: "Erigga",
          artwork_url: "/street-music-album.png",
          duration_ms: 280000,
          mood_category: mood,
        },
      ]
      setPlaylist(mockTracks)
      if (!currentTrack) setCurrentTrack(mockTracks[0])
    }
  }

  const loadLiveBroadcast = async () => {
    try {
      const { data: broadcast } = await supabase.from("live_broadcasts").select("*").eq("is_live", true).single()

      if (broadcast) {
        setLiveBroadcast(broadcast)
      }
    } catch (error) {
      // Mock live broadcast for demo
      setLiveBroadcast({
        id: "1",
        title: "Erigga Live Session",
        description: "Live from the studio with Paper Boi",
        is_live: Math.random() > 0.5,
        listener_count: Math.floor(Math.random() * 1000) + 100,
        scheduled_time: "8:00 PM WAT",
      })
    }
  }

  const loadShoutOuts = async () => {
    try {
      const { data: messages } = await supabase
        .from("community_shoutouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      if (messages) {
        setShoutOuts(messages)
      }
    } catch (error) {
      // Mock shout-outs for demo
      setShoutOuts([
        {
          id: "1",
          username: "WarriFan",
          message: "Paper Boi dey always deliver! 🔥",
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          username: "StreetKing",
          message: "This beat dey mad o! Keep am coming",
          timestamp: new Date().toISOString(),
        },
        {
          id: "3",
          username: "LagosHustler",
          message: "Erigga Radio bringing that authentic street sound 💯",
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }

  const loadPinnedTracks = async () => {
    if (!user) return

    try {
      const { data: pinned } = await supabase
        .from("user_pinned_tracks")
        .select("track_id, radio_tracks(*)")
        .eq("user_id", user.id)

      if (pinned) {
        const tracks = pinned.map((p: any) => ({ ...p.radio_tracks, is_pinned: true }))
        setPinnedTracks(tracks)
      }
    } catch (error) {
      console.error("Error loading pinned tracks:", error)
    }
  }

  const togglePlayPause = async () => {
    if (!audioRef.current) return

    setIsLoading(true)
    try {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        await audioRef.current.play()
      }
    } catch (error) {
      console.error("Playback error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const playNextTrack = () => {
    const currentIndex = playlist.findIndex((track) => track.id === currentTrack?.id)
    const nextIndex = isShuffled ? Math.floor(Math.random() * playlist.length) : (currentIndex + 1) % playlist.length

    if (playlist[nextIndex]) {
      setCurrentTrack(playlist[nextIndex])
    }
  }

  const playPreviousTrack = () => {
    const currentIndex = playlist.findIndex((track) => track.id === currentTrack?.id)
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1

    if (playlist[prevIndex]) {
      setCurrentTrack(playlist[prevIndex])
    }
  }

  const togglePinTrack = async (track: Track) => {
    if (!user) return

    try {
      if (track.is_pinned) {
        await supabase.from("user_pinned_tracks").delete().eq("user_id", user.id).eq("track_id", track.id)
        setPinnedTracks((prev) => prev.filter((t) => t.id !== track.id))
      } else {
        await supabase.from("user_pinned_tracks").insert({
          user_id: user.id,
          track_id: track.id,
        })
        setPinnedTracks((prev) => [...prev, { ...track, is_pinned: true }])
      }
    } catch (error) {
      console.error("Error toggling pin:", error)
    }
  }

  const sendShoutOut = async () => {
    if (!newShoutOut.trim() || !user) return

    try {
      const shoutOut = {
        id: Date.now().toString(),
        username: user.email?.split("@")[0] || "Fan",
        message: newShoutOut,
        timestamp: new Date().toISOString(),
      }

      await supabase.from("community_shoutouts").insert({
        user_id: user.id,
        message: newShoutOut,
      })

      setShoutOuts((prev) => [shoutOut, ...prev.slice(0, 9)])
      setNewShoutOut("")
    } catch (error) {
      console.error("Error sending shout-out:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const selectedMoodData = moodCategories.find((mood) => mood.id === selectedMood)

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Background Street Textures */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/graffiti-street-texture.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      </div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20"
            style={{
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    x: [0, 50, -50, 0],
                    y: [0, -50, 50, 0],
                    scale: [1, 1.2, 0.8, 1],
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

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-black mb-4 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent"
            style={{
              textShadow: "0 0 30px rgba(255, 165, 0, 0.5)",
              fontFamily: "Impact, Arial Black, sans-serif",
              letterSpacing: "0.1em",
            }}
          >
            ERIGGA RADIO
          </motion.h1>
          <motion.p
            className="text-2xl md:text-3xl font-bold text-orange-300 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Vibes for Every Mood
          </motion.p>

          {/* Lagos Skyline Silhouette */}
          <motion.div
            className="w-full h-20 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-8"
            style={{
              clipPath:
                "polygon(0 100%, 10% 60%, 20% 80%, 30% 40%, 40% 70%, 50% 30%, 60% 65%, 70% 45%, 80% 75%, 90% 55%, 100% 100%)",
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          />

          {/* Daily Quote */}
          <motion.div
            className="glass-card p-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <p className="text-lg italic text-orange-200">"{dailyQuote}"</p>
          </motion.div>

          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <div className="relative">
              <EriggaRadio />
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full blur-xl"
                animate={
                  prefersReducedMotion
                    ? {}
                    : {
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }
                }
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Mood Selector Grid */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-orange-300">Choose Your Vibe</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {moodCategories.map((mood, index) => (
              <motion.div
                key={mood.id}
                className={cn(
                  "relative cursor-pointer rounded-2xl p-6 text-center transition-all duration-300",
                  "hover:scale-105 hover:shadow-2xl",
                  selectedMood === mood.id
                    ? `bg-gradient-to-br ${mood.color} shadow-lg shadow-orange-500/25`
                    : `${mood.gradient} hover:bg-opacity-80`,
                )}
                onClick={() => setSelectedMood(mood.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              >
                <div className="text-4xl mb-3">{mood.emoji}</div>
                <div className="mb-2">{mood.icon}</div>
                <h3 className="font-bold text-lg mb-1">{mood.name}</h3>
                <p className="text-sm opacity-80">{mood.description}</p>

                {selectedMood === mood.id && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/50"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Player */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Card className="glass-card border-orange-500/20">
              <CardContent className="p-8">
                {/* Cassette/Vinyl Player Interface */}
                <div className="relative mb-8">
                  <motion.div
                    className="aspect-square max-w-sm mx-auto rounded-full overflow-hidden shadow-2xl border-8 border-orange-500/30"
                    animate={isPlaying && !prefersReducedMotion ? { rotate: 360 } : {}}
                    transition={{
                      duration: 10,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  >
                    <img
                      src={currentTrack?.artwork_url || "/placeholder.svg?height=400&width=400&query=vinyl record"}
                      alt={currentTrack?.title || "Now Playing"}
                      className="w-full h-full object-cover"
                    />

                    {/* Vinyl Center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-black rounded-full border-4 border-orange-500 flex items-center justify-center">
                        <div className="w-4 h-4 bg-orange-500 rounded-full" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Beat Visualizers */}
                  {isPlaying && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {[...Array(7)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 bg-gradient-to-t from-orange-500 to-red-500 rounded-full"
                          animate={
                            prefersReducedMotion
                              ? {}
                              : {
                                  height: [10, 40, 10],
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
                  <h2 className="text-3xl font-bold mb-2 text-orange-300">
                    {currentTrack?.title || "Select a mood to start"}
                  </h2>
                  <p className="text-xl text-gray-300">{currentTrack?.artist || "Erigga Radio"}</p>
                  {selectedMoodData && (
                    <Badge className={`mt-2 bg-gradient-to-r ${selectedMoodData.color}`}>
                      {selectedMoodData.emoji} {selectedMoodData.name}
                    </Badge>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <Slider value={[currentTime]} max={duration || 100} step={1} className="w-full" />
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-6 mb-6">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => setIsShuffled(!isShuffled)}
                    className={cn("text-white hover:text-orange-300", isShuffled && "text-orange-400")}
                  >
                    <Shuffle className="w-6 h-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={playPreviousTrack}
                    className="text-white hover:text-orange-300"
                  >
                    <SkipBack className="w-6 h-6" />
                  </Button>

                  <Button
                    size="lg"
                    className="rounded-full w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    onClick={togglePlayPause}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={playNextTrack}
                    className="text-white hover:text-orange-300"
                  >
                    <SkipForward className="w-6 h-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => setIsRepeating(!isRepeating)}
                    className={cn("text-white hover:text-orange-300", isRepeating && "text-orange-400")}
                  >
                    <Repeat className="w-6 h-6" />
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white hover:text-orange-300"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <Slider
                    value={[volume]}
                    max={100}
                    step={1}
                    onValueChange={(value) => setVolume(value[0])}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-400 w-12">{volume}%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            {/* Live Broadcast Card */}
            <Card className="glass-card border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-300">
                  <Radio className="w-5 h-5" />
                  Live Broadcast
                  {liveBroadcast?.is_live && (
                    <Badge variant="destructive" className="animate-pulse">
                      🔴 LIVE
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {liveBroadcast ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-white">{liveBroadcast.title}</h3>
                      <p className="text-sm text-gray-400">{liveBroadcast.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{liveBroadcast.listener_count} listening</span>
                      </div>
                      {!liveBroadcast.is_live && liveBroadcast.scheduled_time && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{liveBroadcast.scheduled_time}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                      onClick={() => setShowChat(!showChat)}
                    >
                      {liveBroadcast.is_live ? "Join Live Chat" : "Set Reminder"}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Radio className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">No live broadcast scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Playlist Queue */}
            <Card className="glass-card border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-orange-300">
                  {selectedMoodData?.emoji} {selectedMoodData?.name} Playlist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {playlist.map((track, index) => (
                      <motion.div
                        key={track.id}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                          currentTrack?.id === track.id
                            ? "bg-orange-500/20 border border-orange-500/30"
                            : "hover:bg-white/5",
                        )}
                        onClick={() => setCurrentTrack(track)}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <img
                          src={track.artwork_url || "/placeholder.svg?height=60&width=60&query=album cover"}
                          alt={track.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{track.title}</p>
                          <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePinTrack(track)
                          }}
                          className="text-gray-400 hover:text-orange-300"
                        >
                          {track.is_pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Community Shout-outs */}
            <Card className="glass-card border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-300">
                  <MessageCircle className="w-5 h-5" />
                  Fan Shout-outs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Send a shout-out..."
                      value={newShoutOut}
                      onChange={(e) => setNewShoutOut(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendShoutOut()}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                    <Button
                      onClick={sendShoutOut}
                      disabled={!newShoutOut.trim()}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Send
                    </Button>
                  </div>

                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {shoutOuts.map((shoutOut) => (
                        <motion.div
                          key={shoutOut.id}
                          className="p-3 rounded-lg bg-white/5 border border-white/10"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-blue-300">@{shoutOut.username}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(shoutOut.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">{shoutOut.message}</p>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack ? `/api/radio/stream/${currentTrack.id}` : undefined}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
      />
    </div>
  )
}
