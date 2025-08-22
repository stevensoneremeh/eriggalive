"use client"

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
  Clock,
  List,
  History,
  ExternalLink,
  Settings,
  AirplayIcon as AirplayIconBroadcast,
  Key,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  source: "spotify" | "apple" | "audiomack" | "boomplay" | "youtube" | "custom"
  external_id: string
  position?: number
}

interface RadioSettings {
  is_live: boolean
  live_title: string
  live_stream_url: string
}

interface Broadcast {
  id: string
  title: string
  description: string
  status: "scheduled" | "live" | "ended"
  playback_url: string
  stream_key: string
  created_by: string
  started_at: string | null
  ended_at: string | null
  max_listeners: number
}

export default function RadioPage() {
  const { isAuthenticated, user, profile } = useAuth()
  const supabase = createClient()
  const audioRef = useRef<HTMLAudioElement>(null)

  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [volume, setVolume] = useState(70)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Radio state
  const [isLive, setIsLive] = useState(false)
  const [liveTitle, setLiveTitle] = useState("Erigga Radio - 24/7 Street Beats")
  const [listenerCount, setListenerCount] = useState(247)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [queue, setQueue] = useState<Track[]>([])
  const [history, setHistory] = useState<Track[]>([])
  const [activeTab, setActiveTab] = useState("now-playing")

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [currentBroadcast, setCurrentBroadcast] = useState<Broadcast | null>(null)
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastDescription, setBroadcastDescription] = useState("")
  const [streamKey, setStreamKey] = useState("")
  const [showStreamKey, setShowStreamKey] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminMessage, setAdminMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Check admin status and load current broadcast
  useEffect(() => {
    if (profile?.tier === "blood_brotherhood" || profile?.tier === "elder") {
      setIsAdmin(true)
      loadCurrentBroadcast()
    }
  }, [profile])

  // Load radio data
  useEffect(() => {
    loadRadioData()
    setupRealtimeSubscription()
  }, [])

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

  const loadRadioData = async () => {
    try {
      // Load radio settings
      const { data: settings } = await supabase.from("radio_settings").select("*").single()

      if (settings) {
        setIsLive(settings.is_live)
        setLiveTitle(settings.live_title || "Erigga Radio - 24/7 Street Beats")
      }

      // Load current track
      const { data: nowPlaying } = await supabase
        .from("radio_now_playing")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(1)
        .single()

      if (nowPlaying) {
        setCurrentTrack(nowPlaying)
      }

      // Load queue
      const { data: queueData } = await supabase
        .from("radio_queue")
        .select("*")
        .eq("is_played", false)
        .order("position")
        .limit(10)

      if (queueData) {
        setQueue(queueData)
      }

      // Load history
      const { data: historyData } = await supabase
        .from("radio_history")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20)

      if (historyData) {
        setHistory(historyData)
      }
    } catch (error) {
      console.error("Error loading radio data:", error)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("radio-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "radio_settings" }, (payload) => {
        if (payload.new) {
          setIsLive(payload.new.is_live)
          setLiveTitle(payload.new.live_title || "Erigga Radio")
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "radio_now_playing" }, (payload) => {
        if (payload.new) {
          setCurrentTrack(payload.new)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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

  const toggleMute = () => {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const playNextTrack = async () => {
    if (queue.length > 0) {
      const nextTrack = queue[0]
      setCurrentTrack(nextTrack)

      // Update queue
      const updatedQueue = queue.slice(1)
      setQueue(updatedQueue)

      // Add to history
      setHistory((prev) => [nextTrack, ...prev.slice(0, 19)])

      // Update database
      await supabase
        .from("radio_queue")
        .update({ is_played: true, played_at: new Date().toISOString() })
        .eq("id", nextTrack.id)
    }
  }

  const playPreviousTrack = () => {
    if (history.length > 0) {
      const previousTrack = history[0]
      setCurrentTrack(previousTrack)
      setHistory((prev) => prev.slice(1))
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const loadCurrentBroadcast = async () => {
    try {
      const { data: broadcast } = await supabase
        .from("radio_broadcasts")
        .select("*")
        .in("status", ["scheduled", "live"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (broadcast) {
        setCurrentBroadcast(broadcast)
        setBroadcastTitle(broadcast.title)
        setBroadcastDescription(broadcast.description || "")
        setStreamKey(broadcast.stream_key || "")

        if (broadcast.status === "live") {
          setConnectionStatus("connected")
        }
      }
    } catch (error) {
      console.error("Error loading broadcast:", error)
    }
  }

  const generateStreamKey = async () => {
    const newStreamKey = `erigga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setStreamKey(newStreamKey)

    if (currentBroadcast) {
      await supabase.from("radio_broadcasts").update({ stream_key: newStreamKey }).eq("id", currentBroadcast.id)
    }
  }

  const copyStreamKey = async () => {
    try {
      await navigator.clipboard.writeText(streamKey)
      setAdminMessage({ type: "success", text: "Stream key copied to clipboard!" })
      setTimeout(() => setAdminMessage(null), 3000)
    } catch (error) {
      setAdminMessage({ type: "error", text: "Failed to copy stream key" })
      setTimeout(() => setAdminMessage(null), 3000)
    }
  }

  const startLiveBroadcast = async () => {
    if (!broadcastTitle.trim()) {
      setAdminMessage({ type: "error", text: "Please enter a broadcast title" })
      setTimeout(() => setAdminMessage(null), 3000)
      return
    }

    setAdminLoading(true)
    try {
      let broadcastId = currentBroadcast?.id

      if (!currentBroadcast) {
        // Create new broadcast
        const { data: newBroadcast, error } = await supabase
          .from("radio_broadcasts")
          .insert({
            title: broadcastTitle,
            description: broadcastDescription,
            status: "scheduled",
            stream_key: streamKey || `erigga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_by: user?.id,
            playback_url: `https://stream.example.com/live/${streamKey}.m3u8`,
          })
          .select()
          .single()

        if (error) throw error
        setCurrentBroadcast(newBroadcast)
        broadcastId = newBroadcast.id
      }

      // Update broadcast to live status
      await supabase
        .from("radio_broadcasts")
        .update({
          status: "live",
          started_at: new Date().toISOString(),
        })
        .eq("id", broadcastId)

      // Update radio settings to live mode
      await supabase.from("radio_settings").update({
        is_live: true,
        live_title: broadcastTitle,
        live_stream_url: `https://stream.example.com/live/${streamKey}.m3u8`,
        updated_by: user?.id,
      })

      setIsLive(true)
      setLiveTitle(broadcastTitle)
      setConnectionStatus("connected")
      setAdminMessage({ type: "success", text: "Live broadcast started successfully!" })

      // Update now playing to show live status
      await supabase.from("radio_now_playing").insert({
        source: "custom",
        title: broadcastTitle,
        artist: "Erigga Live",
        artwork_url: "/live-broadcast.png",
        is_live: true,
      })
    } catch (error) {
      console.error("Error starting broadcast:", error)
      setAdminMessage({ type: "error", text: "Failed to start broadcast" })
    } finally {
      setAdminLoading(false)
      setTimeout(() => setAdminMessage(null), 5000)
    }
  }

  const stopLiveBroadcast = async () => {
    if (!currentBroadcast) return

    setAdminLoading(true)
    try {
      // Update broadcast to ended status
      await supabase
        .from("radio_broadcasts")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
        })
        .eq("id", currentBroadcast.id)

      // Update radio settings back to auto mode
      await supabase.from("radio_settings").update({
        is_live: false,
        live_title: "Erigga Radio - 24/7 Street Beats",
        live_stream_url: null,
        updated_by: user?.id,
      })

      setIsLive(false)
      setLiveTitle("Erigga Radio - 24/7 Street Beats")
      setConnectionStatus("disconnected")
      setCurrentBroadcast(null)
      setBroadcastTitle("")
      setBroadcastDescription("")
      setAdminMessage({ type: "success", text: "Live broadcast ended successfully!" })

      // Resume auto mode with next track from queue
      if (queue.length > 0) {
        playNextTrack()
      }
    } catch (error) {
      console.error("Error stopping broadcast:", error)
      setAdminMessage({ type: "error", text: "Failed to stop broadcast" })
    } finally {
      setAdminLoading(false)
      setTimeout(() => setAdminMessage(null), 5000)
    }
  }

  const saveBroadcastSettings = async () => {
    if (!currentBroadcast) return

    setAdminLoading(true)
    try {
      await supabase
        .from("radio_broadcasts")
        .update({
          title: broadcastTitle,
          description: broadcastDescription,
        })
        .eq("id", currentBroadcast.id)

      if (isLive) {
        await supabase.from("radio_settings").update({
          live_title: broadcastTitle,
          updated_by: user?.id,
        })

        setLiveTitle(broadcastTitle)
      }

      setAdminMessage({ type: "success", text: "Broadcast settings saved!" })
    } catch (error) {
      console.error("Error saving settings:", error)
      setAdminMessage({ type: "error", text: "Failed to save settings" })
    } finally {
      setAdminLoading(false)
      setTimeout(() => setAdminMessage(null), 3000)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/10">
        <Card className="glass-card p-8 text-center max-w-md">
          <CardContent>
            <Radio className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to access Erigga Radio and enjoy 24/7 streaming.
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Background ambient waves */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-primary to-accent"
              style={{
                width: `${200 + i * 100}px`,
                height: `${200 + i * 100}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      x: [0, 30, -30, 0],
                      y: [0, -30, 30, 0],
                      scale: [1, 1.1, 0.9, 1],
                    }
              }
              transition={{
                duration: 20 + i * 5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <Radio className="w-6 h-6 text-white" />
                </div>
                {isLive && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
                    animate={
                      prefersReducedMotion
                        ? {}
                        : {
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.7, 1],
                          }
                    }
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Erigga Radio
                  {isLive && (
                    <Badge variant="destructive" className="animate-pulse">
                      LIVE
                    </Badge>
                  )}
                </h1>
                <p className="text-muted-foreground">{liveTitle}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{listenerCount.toLocaleString()} listeners</span>
              </div>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setShowAdminPanel(!showAdminPanel)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <EriggaRadio />
        </motion.div>

        <AnimatePresence>
          {showAdminPanel && isAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
              className="mb-8"
            >
              <Card className="glass-card border-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AirplayIconBroadcast className="w-5 h-5" />
                    Live Broadcast Controls
                    {connectionStatus === "connected" && (
                      <Badge variant="destructive" className="ml-2">
                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                        LIVE
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Admin Messages */}
                  <AnimatePresence>
                    {adminMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Alert className={adminMessage.type === "success" ? "border-green-500" : "border-red-500"}>
                          {adminMessage.type === "success" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <AlertDescription>{adminMessage.text}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Broadcast Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Broadcast Settings</h3>

                      <div className="space-y-2">
                        <Label htmlFor="broadcast-title">Broadcast Title</Label>
                        <Input
                          id="broadcast-title"
                          value={broadcastTitle}
                          onChange={(e) => setBroadcastTitle(e.target.value)}
                          placeholder="Enter broadcast title..."
                          disabled={adminLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="broadcast-description">Description (Optional)</Label>
                        <Textarea
                          id="broadcast-description"
                          value={broadcastDescription}
                          onChange={(e) => setBroadcastDescription(e.target.value)}
                          placeholder="Describe your broadcast..."
                          rows={3}
                          disabled={adminLoading}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={saveBroadcastSettings}
                          disabled={adminLoading || !broadcastTitle.trim()}
                          variant="outline"
                          size="sm"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Settings
                        </Button>
                      </div>
                    </div>

                    {/* Stream Configuration */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Stream Configuration</h3>

                      <div className="space-y-2">
                        <Label>RTMP Server</Label>
                        <Input value="rtmp://stream.eriggaradio.com/live" readOnly className="bg-muted" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Stream Key</Label>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowStreamKey(!showStreamKey)}>
                              {showStreamKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={copyStreamKey}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={generateStreamKey}>
                              <Key className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <Input
                          value={showStreamKey ? streamKey : "••••••••••••••••"}
                          readOnly
                          className="bg-muted font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Use this key in your streaming software (OBS, etc.)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Connection Status</Label>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              connectionStatus === "connected"
                                ? "bg-green-500 animate-pulse"
                                : connectionStatus === "connecting"
                                  ? "bg-yellow-500 animate-pulse"
                                  : "bg-gray-400",
                            )}
                          />
                          <span className="text-sm capitalize">{connectionStatus}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Broadcast Controls */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Broadcast Controls</h3>
                        <p className="text-sm text-muted-foreground">
                          {isLive ? "Your broadcast is currently live" : "Start your live broadcast when ready"}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        {!isLive ? (
                          <Button
                            onClick={startLiveBroadcast}
                            disabled={adminLoading || !broadcastTitle.trim()}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {adminLoading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                              <AirplayIconBroadcast className="w-4 h-4 mr-2" />
                            )}
                            Go Live
                          </Button>
                        ) : (
                          <Button onClick={stopLiveBroadcast} disabled={adminLoading} variant="destructive">
                            {adminLoading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-2" />
                            )}
                            End Broadcast
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Live Stats */}
                    {isLive && currentBroadcast && (
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-accent/10 rounded-lg">
                          <div className="text-2xl font-bold text-red-500">{listenerCount}</div>
                          <div className="text-sm text-muted-foreground">Live Listeners</div>
                        </div>
                        <div className="text-center p-3 bg-accent/10 rounded-lg">
                          <div className="text-2xl font-bold">
                            {currentBroadcast.started_at
                              ? Math.floor((Date.now() - new Date(currentBroadcast.started_at).getTime()) / 60000)
                              : 0}
                            m
                          </div>
                          <div className="text-sm text-muted-foreground">Duration</div>
                        </div>
                        <div className="text-center p-3 bg-accent/10 rounded-lg">
                          <div className="text-2xl font-bold">{currentBroadcast.max_listeners || 0}</div>
                          <div className="text-sm text-muted-foreground">Peak Listeners</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Player */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.2 }}
          >
            <Card className="glass-card">
              <CardContent className="p-8">
                {/* Track Artwork */}
                <div className="relative mb-8">
                  <motion.div
                    className="aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl"
                    whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={currentTrack?.artwork_url || "/placeholder.svg?height=400&width=400&query=music album cover"}
                      alt={currentTrack?.title || "Now Playing"}
                      className="w-full h-full object-cover"
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16"
                        onClick={togglePlayPause}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6" />
                        )}
                      </Button>
                    </div>
                  </motion.div>

                  {/* Equalizer visualization */}
                  {isPlaying && (
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-accent rounded-full"
                          animate={
                            prefersReducedMotion
                              ? {}
                              : {
                                  height: [8, 24, 8],
                                  opacity: [0.5, 1, 0.5],
                                }
                          }
                          transition={{
                            duration: 1,
                            repeat: Number.POSITIVE_INFINITY,
                            delay: i * 0.2,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">{currentTrack?.title || "Welcome to Erigga Radio"}</h2>
                  <p className="text-lg text-muted-foreground">{currentTrack?.artist || "24/7 Street Beats"}</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={1}
                    onValueChange={handleSeek}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <Button variant="ghost" size="lg" onClick={playPreviousTrack} disabled={history.length === 0}>
                    <SkipBack className="w-6 h-6" />
                  </Button>

                  <Button size="lg" className="rounded-full w-16 h-16" onClick={togglePlayPause} disabled={isLoading}>
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </Button>

                  <Button variant="ghost" size="lg" onClick={playNextTrack} disabled={queue.length === 0}>
                    <SkipForward className="w-6 h-6" />
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Slider value={[volume]} max={100} step={1} onValueChange={handleVolumeChange} className="flex-1" />
                  <span className="text-sm text-muted-foreground w-8">{volume}%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.4 }}
          >
            <Card className="glass-card">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="now-playing" className="text-xs">
                      <Clock className="w-4 h-4 mr-1" />
                      Now
                    </TabsTrigger>
                    <TabsTrigger value="queue" className="text-xs">
                      <List className="w-4 h-4 mr-1" />
                      Queue
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-xs">
                      <History className="w-4 h-4 mr-1" />
                      History
                    </TabsTrigger>
                    <TabsTrigger value="sources" className="text-xs">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Sources
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="now-playing" className="mt-4">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Now Playing</h3>
                      {currentTrack ? (
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/10">
                          <img
                            src={currentTrack.artwork_url || "/placeholder.svg"}
                            alt={currentTrack.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{currentTrack.title}</p>
                            <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No track currently playing</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="queue" className="mt-4">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Up Next ({queue.length})</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {queue.map((track, index) => (
                          <div
                            key={track.id}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/10 transition-colors"
                          >
                            <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                            <img
                              src={track.artwork_url || "/placeholder.svg"}
                              alt={track.title}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{track.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                            </div>
                          </div>
                        ))}
                        {queue.length === 0 && <p className="text-muted-foreground text-sm">Queue is empty</p>}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-4">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Recently Played</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {history.map((track, index) => (
                          <div
                            key={`${track.id}-${index}`}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/10 transition-colors"
                          >
                            <img
                              src={track.artwork_url || "/placeholder.svg"}
                              alt={track.title}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{track.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                            </div>
                          </div>
                        ))}
                        {history.length === 0 && <p className="text-muted-foreground text-sm">No history available</p>}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="sources" className="mt-4">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Music Sources</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: "Spotify", color: "bg-green-500", available: true },
                          { name: "Apple Music", color: "bg-gray-800", available: true },
                          { name: "Audiomack", color: "bg-orange-500", available: true },
                          { name: "Boomplay", color: "bg-blue-500", available: true },
                          { name: "YouTube Music", color: "bg-red-500", available: true },
                          { name: "SoundCloud", color: "bg-orange-400", available: false },
                        ].map((source) => (
                          <Button
                            key={source.name}
                            variant={source.available ? "outline" : "ghost"}
                            size="sm"
                            disabled={!source.available}
                            className="justify-start"
                          >
                            <div className={cn("w-3 h-3 rounded-full mr-2", source.color)} />
                            {source.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Sponsor Banner */}
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">Sponsored</p>
                <div className="bg-gradient-to-r from-primary to-accent rounded-lg p-4 text-white">
                  <p className="font-semibold">Support Erigga</p>
                  <p className="text-sm opacity-90">Get exclusive merch and content</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onError={() => {
          setIsLoading(false)
          setIsPlaying(false)
        }}
      >
        <source
          src={
            isLive
              ? "https://example.com/live-stream.m3u8"
              : "https://yor5bfsajnljnrjg.public.blob.vercel-storage.com/erigga-radio-stream-qGVtALspqbLlH9VQJgg93RVa3Qs7Kb.mp3"
          }
          type={isLive ? "application/x-mpegURL" : "audio/mpeg"}
        />
        Your browser does not support the audio element.
      </audio>
    </div>
  )
}
