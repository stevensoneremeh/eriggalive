"use client"

import { useState } from "react"
import { Play, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Video {
  id: string
  title: string
  description: string
  thumbnail_url: string
  video_url: string
  view_count: number
}

export default function VideoHero({ video }: { video: Video }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Background Video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        poster={video.thumbnail_url}
        muted={isMuted}
        autoPlay
        loop
      >
        <source src={video.video_url} type="video/mp4" />
      </video>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-start justify-end p-6 md:p-12 lg:p-16">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            <span className="text-balance">{video.title}</span>
          </h1>
          <p className="text-lg text-gray-200 md:text-xl">{video.description}</p>
          <div className="flex items-center gap-4 pt-4">
            <Button
              size="lg"
              className="gap-2 bg-white text-black hover:bg-gray-200"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              <Play className="h-5 w-5 fill-current" />
              Watch Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 bg-transparent"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>
          <p className="text-sm text-gray-300">{video.view_count.toLocaleString()} views</p>
        </div>
      </div>
    </div>
  )
}
