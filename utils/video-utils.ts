export interface VideoSource {
  src: string
  type: string
}

export function getOptimizedVideoSources(): VideoSource[] {
  return [
    {
      src: "/videos/erigga-hero-video.mp4",
      type: "video/mp4",
    },
    {
      src: "/videos/erigga-hero-video.webm",
      type: "video/webm",
    },
  ]
}

export function getVideoFallbackImage(): string {
  return "/images/hero/erigga1.jpeg"
}

export async function tryPlayVideo(video: HTMLVideoElement): Promise<boolean> {
  try {
    await video.play()
    return true
  } catch (error) {
    console.warn("Video autoplay failed:", error)
    return false
  }
}
