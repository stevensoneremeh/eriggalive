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
      src: "/videos/erigga-hero-4k.mp4",
      type: "video/mp4",
      quality: "4K",
    },
    {
      src: "/videos/erigga-hero-1080p.mp4",
      type: "video/mp4",
      quality: "1080p",
    },
    {
      src: "/videos/erigga-hero-720p.mp4",
      type: "video/mp4",
      quality: "720p",
    },
  ]
}

export const getVideoFallbackImage = () => {
  return "https://sjc.microlink.io/IaN12rZuSAqtEATHm3KCTGa2_hNlLsaQg4BsrIa3dGYlV_tAjMf5vMocKaI5sKhQYuShLe9MIP1Emy_1sSqlOA.jpeg"
}

/**
 * Instructions for adding the Instagram reel video:
 *
 * 1. Download the Instagram reel video from:
 *    https://www.instagram.com/reel/DJmYEProGNc/
 *
 * 2. Use a tool like:
 *    - SnapInsta (snapinsta.app)
 *    - SaveFrom.net
 *    - Or any Instagram video downloader
 *
 * 3. Save the video as: public/videos/erigga-hero-video.mp4
 *
 * 4. For best performance, create multiple quality versions:
 *    - 4K version for desktop
 *    - 1080p version for tablets
 *    - 720p version for mobile
 *
 * 5. Update the video source in the homepage component
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
      preload: "metadata",
    },
  }
}
