"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Users,
  Heart,
  Share2,
  Clock,
  Mic,
  Music,
  Headphones,
  Signal,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

interface RadioStation {
  id: string
  name: string
  frequency: string
  description: string
  genre: string
  listeners: number
  isLive: boolean
  currentShow?: string
  nextShow?: string
  streamUrl: string
}

const radioStations: RadioStation[] = [
  {
    id: "erigga-live",
    name: "Erigga Live Radio",
    frequency: "101.5 FM",
    description: "The official Erigga radio station featuring exclusive tracks, interviews, and live shows",
    genre: "Hip-Hop/Rap",
    listeners: 12847,
    isLive: true,
    currentShow: "Street Chronicles with Erigga",
    nextShow: "Fan Request Hour",
    streamUrl: "/audio/erigga-radio-stream.mp3",
  },
  {
    id: "warri-vibes",
    name: "Warri Vibes",
    frequency: "95.3 FM",
    description: "Bringing you the best of Delta State music and culture",
    genre: "Afrobeats/Local",
    listeners: 8234,
    isLive: true,
    currentShow: "Morning Motivation",
    nextShow: "Pidgin Talk Show",
    streamUrl: "/audio/warri-vibes-stream.mp3",
  },
  {
    id: "street-beats",
    name: "Street Beats",
    frequency: "88.7 FM",
    description: "Raw street music and underground hits",
    genre: "Street/Underground",
    listeners: 5691,
    isLive: false,
    currentShow: "Replay: Best of Street Beats",
    nextShow: "Live at 6 PM",
    streamUrl: "/audio/street-beats-stream.mp3",
  },
]

export default function RadioPage() {
  const [currentStation, setCurrentStation] = useState<RadioStation>(radioStations[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([75])
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState("0:00")
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handlePlayPause = async () => {
    if (!audioRef.current) return

    setIsLoading(true)

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
        toast.info(`Stopped ${currentStation.name}`)
      } else {
        // In a real implementation, you would load the actual stream
        // For demo purposes, we'll simulate loading
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setIsPlaying(true)
        toast.success(`Now playing ${currentStation.name}`)
      }
    } catch (error) {
      toast.error("Failed to load radio stream")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStationChange = (station: RadioStation) => {
    setCurrentStation(station)
    setIsPlaying(false)
    toast.info(`Switched to ${station.name}`)
  }

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume[0] / 100
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${currentStation.name} - Erigga Live`,
        text: `Listen to ${currentStation.currentShow} on ${currentStation.name}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
            <Radio className="h-5 w-5" />
            LIVE RADIO
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
            Erigga Live Radio
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Tune in to exclusive music, live shows, and connect with the Erigga community 24/7
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Player */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl border-purple-500/20 shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Radio className="h-6 w-6 text-white" />
                      </div>
                      {currentStation.isLive && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">{currentStation.name}</CardTitle>
                      <CardDescription className="text-gray-300">
                        {currentStation.frequency} • {currentStation.genre}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentStation.isLive && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                        <div className="w-2 h-2 bg-red-400 rounded-full mr-2" />
                        LIVE
                      </Badge>
                    )}
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      <Users className="h-3 w-3 mr-1" />
                      {currentStation.listeners.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Current Show Info */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Mic className="h-5 w-5 text-purple-400" />
                    <span className="text-purple-400 font-medium">Now Playing</span>
                    <div className="flex-1 border-t border-purple-500/30" />
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {currentTime}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{currentStation.currentShow}</h3>
                  <p className="text-gray-300">{currentStation.description}</p>

                  {currentStation.nextShow && (
                    <div className="mt-4 pt-4 border-t border-purple-500/20">
                      <span className="text-sm text-gray-400">Up Next: </span>
                      <span className="text-purple-400 font-medium">{currentStation.nextShow}</span>
                    </div>
                  )}
                </div>

                {/* Player Controls */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <Button
                      onClick={handlePlayPause}
                      disabled={isLoading}
                      className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg transform transition-all duration-200 hover:scale-105"
                    >
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="h-8 w-8 text-white" />
                      ) : (
                        <Play className="h-8 w-8 text-white ml-1" />
                      )}
                    </Button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={toggleMute} className="text-gray-400 hover:text-white">
                      {isMuted || volume[0] === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>

                    <div className="flex-1">
                      <Slider value={volume} onValueChange={handleVolumeChange} max={100} step={1} className="w-full" />
                    </div>

                    <span className="text-sm text-gray-400 w-12 text-right">{volume[0]}%</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-slate-800/50 border-slate-600 text-gray-300 hover:bg-slate-700/50"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-slate-800/50 border-slate-600 text-gray-300 hover:bg-slate-700/50"
                  >
                    <Heart className="h-4 w-4" />
                    Favorite
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Station List & Info */}
          <div className="space-y-6">
            {/* Station Selector */}
            <Card className="bg-gradient-to-br from-slate-800/80 to-blue-900/80 backdrop-blur-xl border-blue-500/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Signal className="h-5 w-5 text-blue-400" />
                  Available Stations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {radioStations.map((station) => (
                  <div
                    key={station.id}
                    onClick={() => handleStationChange(station)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      currentStation.id === station.id
                        ? "bg-blue-500/20 border-blue-500/50 shadow-lg"
                        : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            station.isLive ? "bg-green-400 animate-pulse" : "bg-gray-500"
                          }`}
                        />
                        <span className="font-medium text-white">{station.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{station.frequency}</span>
                    </div>

                    <p className="text-sm text-gray-300 mb-2">{station.genre}</p>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {station.listeners.toLocaleString()}
                      </span>
                      {station.isLive && <span className="text-green-400">● LIVE</span>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-slate-800/80 to-green-900/80 backdrop-blur-xl border-green-500/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-400" />
                  Live Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Listeners</span>
                  <span className="font-bold text-green-400">
                    {radioStations.reduce((sum, station) => sum + station.listeners, 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Live Stations</span>
                  <span className="font-bold text-blue-400">
                    {radioStations.filter((station) => station.isLive).length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Your Listening Time</span>
                  <span className="font-bold text-purple-400">2h 34m</span>
                </div>
              </CardContent>
            </Card>

            {/* Now Playing History */}
            <Card className="bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl border-purple-500/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Music className="h-5 w-5 text-purple-400" />
                  Recently Played
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: "Paper Boi", artist: "Erigga", time: "2 mins ago" },
                  { title: "The Erigma II", artist: "Erigga", time: "15 mins ago" },
                  { title: "Motivation", artist: "Erigga ft. Victor AD", time: "32 mins ago" },
                  { title: "Area to the World", artist: "Erigga", time: "1 hour ago" },
                ].map((track, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                      <Headphones className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{track.title}</p>
                      <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                    </div>
                    <span className="text-xs text-gray-500">{track.time}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        preload="none"
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setIsPlaying(false)
          toast.error("Failed to load audio stream")
        }}
      />
    </div>
  )
}
