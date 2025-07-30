"use client"

import { useEffect, useState } from "react"

export function VideoTest() {
  const [videoExists, setVideoExists] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Test if video file exists by trying to fetch it
    const testVideo = async () => {
      try {
        const response = await fetch("/videoshttps://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_87iLY6t51DXvy0yPJ00SYhwlKXWl/K6Q-Lit6vuzvhNfoGXuTFB/public/erigga-hero-video.mp4", { method: "HEAD" })
        if (response.ok) {
          setVideoExists(true)
        } else {
          setVideoExists(false)
          setError(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (err) {
        setVideoExists(false)
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    }

    testVideo()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm z-50">
      <h3 className="font-bold mb-2">Video File Status</h3>
      <p>Path: /videoshttps://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_87iLY6t51DXvy0yPJ00SYhwlKXWl/K6Q-Lit6vuzvhNfoGXuTFB/public/erigga-hero-video.mp4</p>
      <p>Status: {videoExists === null ? "Checking..." : videoExists ? "✅ File exists" : "❌ File not found"}</p>
      {error && <p className="text-red-400">Error: {error}</p>}

      {/* Direct video test */}
      <div className="mt-2">
        <p className="mb-1">Direct test:</p>
        <video width="100" height="60" controls muted className="border border-gray-500">
          <source src="/videoshttps://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_87iLY6t51DXvy0yPJ00SYhwlKXWl/K6Q-Lit6vuzvhNfoGXuTFB/public/erigga-hero-video.mp4" type="video/mp4" />
          <source
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/erigga-hero-video-F19YWf5JgcnmasQmH2s37F8lND161t.mp4"
            type="video/mp4"
          />
          Video not supported
        </video>
      </div>
    </div>
  )
}
