/**
 * Video utility functions for the Erigga fan platform
 */

export interface VideoSource {
  src: string
  type: string
  quality?: string
}

export const getOptimizedVideoSources = (): VideoSource[] => {
  return [
    {
      src: "/videos/erigga-hero-video.mp4",
      type: "video/mp4",
      quality: "Original",
    },
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/erigga-hero-video-F19YWf5JgcnmasQmH2s37F8lND161t.mp4",
      type: "video/mp4",
      quality: "Direct",
    },
  ]
}

export const getVideoFallbackImage = () => {
  return "https://sjc.microlink.io/IaN12rZuSAqtEATHm3KCTGa2_hNlLsaQg4BsrIa3dGYlV_tAjMf5vMocKaI5sKhQYuShLe9MIP1Emy_1sSqlOA.jpeg"
}

/**
 * Checks if a video can be played in the current browser
 */
export const canPlayVideo = (videoType = "video/mp4"): boolean => {
  if (typeof document === "undefined") return false

  const video = document.createElement("video")
  return video.canPlayType(videoType) !== ""
}

/**
 * Creates a video element with proper attributes and sources
 */
export const createVideoElement = (sources: VideoSource[], fallbackImage: string) => {
  return {
    sources,
    fallbackImage,
    attributes: {
      autoPlay: true,
      loop: true,
      muted: true,
      playsInline: true,
      controls: false,
      preload: "auto",
    },
  }
}

/**
 * Attempts to play a video with error handling
 */
export const tryPlayVideo = async (videoElement: HTMLVideoElement): Promise<boolean> => {
  try {
    await videoElement.play()
    return true
  } catch (error) {
    console.error("Failed to play video:", error)
    return false
  }
}
