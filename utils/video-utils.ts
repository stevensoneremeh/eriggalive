export interface VideoSource {
  src: string
  type: string
  quality?: string
}

export function getOptimizedVideoSources(): VideoSource[] {
  return [
    {
      src: "/videos/erigga-hero-video.mp4",
      type: "video/mp4",
      quality: "1080p",
    },
    {
      src: "/videos/erigga-hero-video-720p.mp4",
      type: "video/mp4",
      quality: "720p",
    },
    {
      src: "/videos/erigga-hero-video-480p.mp4",
      type: "video/mp4",
      quality: "480p",
    },
  ]
}

export function getVideoThumbnail(videoUrl: string): string {
  // Extract filename without extension and add .jpg
  const filename = videoUrl.split("/").pop()?.split(".")[0]
  return `/images/video-thumbnails/${filename}.jpg`
}

export function preloadVideo(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => resolve()
    video.onerror = reject
    video.src = src
  })
}
