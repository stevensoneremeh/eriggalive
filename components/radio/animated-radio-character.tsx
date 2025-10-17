"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface AnimatedRadioCharacterProps {
  isPlaying: boolean
  isLive: boolean
  shoutouts: string[]
  className?: string
}

export function AnimatedRadioCharacter({ isPlaying, isLive, shoutouts, className }: AnimatedRadioCharacterProps) {
  const [currentShoutoutIndex, setCurrentShoutoutIndex] = useState(0)
  const [showShoutout, setShowShoutout] = useState(false)

  // Cycle through shoutouts when playing
  useEffect(() => {
    if (isPlaying && shoutouts.length > 0) {
      const interval = setInterval(() => {
        setShowShoutout(true)
        setTimeout(() => {
          setCurrentShoutoutIndex((prev) => (prev + 1) % shoutouts.length)
          setShowShoutout(false)
        }, 3000)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [isPlaying, shoutouts])

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      {/* Radio Character Container */}
      <div className="relative">
        {/* Animated Radio GIF */}
        <motion.div
          className="relative z-10"
          animate={
            isPlaying
              ? {
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0],
                }
              : {}
          }
          transition={{
            duration: 2,
            repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
            ease: "easeInOut",
          }}
        >
          <img src="/radio-man.gif" alt="Radio Character" className="w-32 h-32 md:w-40 md:h-40 object-contain" />
        </motion.div>

        {/* Sound Waves Animation */}
        <AnimatePresence>
          {isPlaying && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 border-2 border-white/30 rounded-full"
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{
                    scale: [0.8, 1.5, 2],
                    opacity: [0.8, 0.4, 0],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.6,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Live Indicator */}
        <AnimatePresence>
          {isLive && (
            <motion.div
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <motion.div
                className="flex items-center gap-1"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              >
                <div className="w-2 h-2 bg-white rounded-full" />
                LIVE
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Music Notes */}
        <AnimatePresence>
          {isPlaying && (
            <>
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${10 + i * 10}%`,
                  }}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{
                    y: [-20, -40, -60],
                    opacity: [0, 1, 0],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.5,
                    ease: "easeOut",
                  }}
                >
                  {["🎵", "🎶", "♪", "♫"][i]}
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Fan Shoutouts Display */}
      <div className="mt-6 w-full max-w-md">
        <AnimatePresence mode="wait">
          {showShoutout && shoutouts.length > 0 && (
            <motion.div
              key={currentShoutoutIndex}
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  💬
                </motion.div>
                <span className="text-sm font-bold text-white/80">Fan Says:</span>
              </div>
              <p className="text-white text-sm italic">"{shoutouts[currentShoutoutIndex]}"</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shoutouts Ticker */}
        {!showShoutout && shoutouts.length > 0 && (
          <motion.div
            className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-center gap-2 text-white/60 text-xs">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              >
                📻
              </motion.div>
              <span>{shoutouts.length} fan messages</span>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                •
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Ambient Glow Effect */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="w-full h-full bg-gradient-radial from-purple-500/10 via-transparent to-transparent rounded-full"
          animate={
            isPlaying
              ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }
              : {}
          }
          transition={{
            duration: 4,
            repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  )
}
