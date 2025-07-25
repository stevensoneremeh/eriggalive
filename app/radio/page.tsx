"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Radio, Music, Headphones, Heart, Share2, Download } from "lucide-react"

export default function RadioPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([75])
  const [isMuted, setIsMuted] = useState(false)
  const [currentTrack, setCurrentTrack] = useState({
    title: "Paper Boi",
    artist: "Erigga",
    album: "The Erigma II",
    duration: "3:45",
    currentTime: "1:23",
  })
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // In a real implementation, you would control actual audio playback here
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    setIsMuted(value[0] === 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-pink-400 rounded-full animate-ping" />
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-blue-400 rounded-full animate-bounce" />
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-purple-600/20 rounded-full">
              <Radio className="h-8 w-8 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white">Erigga Radio</h1>
            <div className="p-3 bg-purple-600/20 rounded-full">
              <Music className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <p className="text-xl text-slate-300">24/7 Non-stop hits from the Paper Boi himself</p>
        </div>

        {/* Main Radio Player */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-8">
              {/* Now Playing Display */}
              <div className="text-center mb-8">
                <div className="relative w-64 h-64 mx-auto mb-6">
                  {/* Album Art */}
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-pink-600 p-1">
                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                      <img
                        src="/images/hero/erigga1.jpeg"
                        alt="Now Playing"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  </div>

                  {/* Spinning Animation */}
                  {isPlaying && (
                    <div className="absolute inset-0 rounded-full border-4 border-purple-400/30 animate-spin" />
                  )}

                  {/* Live Indicator */}
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-red-600 text-white animate-pulse">LIVE</Badge>
                  </div>
                </div>

                {/* Track Info */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">{currentTrack.title}</h2>
                  <p className="text-lg text-purple-400">{currentTrack.artist}</p>
                  <p className="text-sm text-slate-400">{currentTrack.album}</p>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 space-y-2">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: "35%" }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>{currentTrack.currentTime}</span>
                    <span>{currentTrack.duration}</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6 mb-8">
                {/* Previous */}
                <Button variant="ghost" size="lg" className="text-slate-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </Button>

                {/* Play/Pause */}
                <Button
                  onClick={togglePlay}
                  size="lg"
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                </Button>

                {/* Next */}
                <Button variant="ghost" size="lg" className="text-slate-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-4 mb-8">
                <Button onClick={toggleMute} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  {isMuted || volume[0] === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>

                <div className="flex-1 max-w-xs">
                  <Slider value={volume} onValueChange={handleVolumeChange} max={100} step={1} className="w-full" />
                </div>

                <span className="text-sm text-slate-400 w-8">{volume[0]}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:text-white bg-transparent"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Like
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:text-white bg-transparent"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:text-white bg-transparent"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Station Info */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Headphones className="h-6 w-6 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">Now On Air</h3>
                </div>
                <div className="space-y-2 text-slate-300">
                  <p>🎵 The Erigma II - Full Album</p>
                  <p>🎤 Exclusive freestyles and unreleased tracks</p>
                  <p>📻 24/7 continuous streaming</p>
                  <p>🔥 Latest hits and fan favorites</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Radio className="h-6 w-6 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">Station Stats</h3>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span>Listeners:</span>
                    <span className="text-purple-400 font-semibold">2,847</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality:</span>
                    <span className="text-green-400 font-semibold">320kbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="text-blue-400 font-semibold">99.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Genre:</span>
                    <span className="text-yellow-400 font-semibold">Afrobeats/Rap</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="none" className="hidden">
        <source src="/audio/erigga-radio-stream.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  )
}
