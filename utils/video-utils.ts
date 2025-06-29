/**
 * Video utility functions for the Erigga fan platform
 *
 * These helpers are written defensively so they never throw on the client.
 */

export interface VideoSource {
  src: string
  type: string
  quality?: string
}

export const getOptimizedVideoSources = (): VideoSource[] => [
  { src: "/videos/erigga-hero-video.mp4", type: "video/mp4", quality: "Local MP4" },
  { src: "/videos/erigga-hero-video.webm", type: "video/webm", quality: "Local WebM" },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/erigga-hero-video-F19YWf5JgcnmasQmH2s37F8lND161t.mp4",
    type: "video/mp4",
    quality: "CDN Fallback",
  },
]

export const getVideoFallbackImage = () => "/images/hero/erigga1.jpeg"

/**
 * Attempts to autoplay a given HTMLVideoElement.
 * If the browser pauses background media (`NotAllowedError`),
 * we wait for the tab to become visible and retry **once**.
 */
export const tryPlayVideo = async (video: HTMLVideoElement): Promise<boolean> => {
  const attempt = async (): Promise<boolean> => {
    try {
      await video.play()
      return true
    } catch (err: any) {
      console.warn("Failed to play video:", err?.name ?? err)
      return false
    }
  }

  // First attempt (most browsers succeed if muted)
  const ok = await attempt()
  if (ok) return true

  // If we’re hidden, wait until the tab becomes visible then retry once
  if (document.visibilityState === "hidden") {
    await new Promise<void>((resolve) => {
      const onVisible = () => {
        document.removeEventListener("visibilitychange", onVisible)
        resolve()
      }
      document.addEventListener("visibilitychange", onVisible)
    })
    return attempt()
  }

  return false
}
