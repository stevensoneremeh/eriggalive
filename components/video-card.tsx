"use client"

import { useState } from "react"
import Image from "next/image"
import { Play, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Video {
  id: string
  title: string
  description: string
  thumbnail_url: string
  video_url: string
  duration_seconds: number
  view_count: number
}

export default function VideoCard({ video }: { video: Video }) {
  const [isHovered, setIsHovered] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <>
      <div
        className="group relative overflow-hidden rounded-lg bg-card shadow-lg transition-all duration-300 hover:shadow-2xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={video.thumbnail_url || "/placeholder.svg"}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs font-semibold text-white">
            {formatDuration(video.duration_seconds)}
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/40">
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-white/90 text-black opacity-0 transition-all duration-300 hover:bg-white group-hover:opacity-100"
              onClick={() => setShowModal(true)}
            >
              <Play className="h-6 w-6 fill-current" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-primary">
            {video.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{video.description}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{video.view_count.toLocaleString()} views</span>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <video className="h-full w-full" controls autoPlay poster={video.thumbnail_url}>
                <source src={video.video_url} type="video/mp4" />
              </video>
            </div>
            <div className="mt-4 space-y-2">
              <h2 className="text-xl font-bold text-white">{video.title}</h2>
              <p className="text-gray-300">{video.description}</p>
              <p className="text-sm text-gray-400">{video.view_count.toLocaleString()} views</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
