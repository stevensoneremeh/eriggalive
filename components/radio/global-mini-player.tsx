"use client"

import { useRef, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Play, Pause, X, Maximize2 } from "lucide-react"
import { useLiveStream } from "@/contexts/live-stream-context"
import Link from "next/link"

export function GlobalMiniPlayer() {
  const { currentStream, isPlaying, setIsPlaying } = useLiveStream()
  const pathname = usePathname()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  const isRadioPage = pathname === "/radio"

  useEffect(() => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.play().catch(console.error)
    } else {
      videoRef.current.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    if (currentStream && videoRef.current) {
      videoRef.current.load()
    }
  }, [currentStream])

  if (!currentStream || isRadioPage || isMinimized) {
    return null
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 md:bottom-4 right-4 z-50 w-80 md:w-96 shadow-2xl rounded-lg overflow-hidden bg-black"
      >
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full aspect-video object-cover"
            poster={currentStream.thumbnail_url || undefined}
            playsInline
            muted
          >
            <source src={currentStream.video_url} type="video/mp4" />
            <source src={currentStream.video_url} type="application/x-mpegURL" />
          </video>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <div className="flex-1 text-white">
                <p className="text-sm font-semibold line-clamp-1">{currentStream.title}</p>
              </div>

              <Link href="/radio">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(true)}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-semibold">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              LIVE
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
