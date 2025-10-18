"use client"
import VideoCard from "./video-card"

interface Video {
  id: string
  title: string
  description: string
  thumbnail_url: string
  video_url: string
  duration_seconds: number
  view_count: number
}

export default function VideoGrid({ videos }: { videos: Video[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}
