"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import { AnimatedRadioCharacter } from "@/components/radio/animated-radio-character"
import { EnhancedShoutOut } from "@/components/radio/enhanced-shout-out"
import { useAuth } from "@/contexts/auth-context"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

interface Track {
  id: string
  title: string
  artist: string
  duration: number
  url: string
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
  },
  {
    id: "2",
    title: "The Erigma",
    artist: "Erigga",
    duration: 180,
    url: "/audio/the-erigma.mp3",
  },
  {
    id: "3",
    title: "Motivation",
    artist: "Erigga ft. Victor AD",
    duration: 200,
    url: "/audio/motivation.mp3",
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
  const audioRef = useRef<HTMLAudioElement>(null)

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

  const track = mockTracks[currentTrack]

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
                      <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
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
