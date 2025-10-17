"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface Scene3DProps {
  onLoaded: () => void
  phoneBooted: boolean
}

function Phone({ phoneBooted }: { phoneBooted: boolean }) {
  const [bootProgress, setBootProgress] = useState(0)

  useEffect(() => {
    if (phoneBooted) {
      const interval = setInterval(() => {
        setBootProgress((prev) => Math.min(prev + 0.02, 1))
      }, 50)
      return () => clearInterval(interval)
    }
  }, [phoneBooted])

  return (
    <div className="relative flex items-center justify-center h-full">
      <motion.div
        animate={{
          rotateY: [0, 360],
          y: [0, -10, 0],
        }}
        transition={{
          rotateY: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
          y: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
        }}
        className="relative"
        style={{
          transformStyle: "preserve-3d",
          perspective: "1000px",
        }}
      >
        {/* Phone Body */}
        <div className="w-64 h-96 bg-gradient-to-b from-gray-800 to-black rounded-3xl shadow-2xl border-4 border-gold/30 relative">
          {/* Screen */}
          <div className="w-full h-full bg-black rounded-2xl m-2 flex flex-col items-center justify-center text-white relative overflow-hidden">
            {/* Screen Content */}
            {phoneBooted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-center space-y-4"
              >
                <motion.h1
                  className="text-2xl font-bold text-gold"
                  animate={{
                    textShadow: ["0 0 5px #FFD700", "0 0 20px #FFD700", "0 0 5px #FFD700"],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  ERIGGA LIVE
                </motion.h1>
                <p className="text-lg text-white/80">Meet & Greet</p>

                {/* Loading Bar */}
                <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gold to-yellow-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${bootProgress * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Screen Flicker Effect */}
            {!phoneBooted && (
              <motion.div
                className="absolute inset-0 bg-blue-500/10"
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 0.1, repeat: Number.POSITIVE_INFINITY, repeatDelay: Math.random() * 2 }}
              />
            )}
          </div>
        </div>

        {/* Glowing Base */}
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-gradient-to-r from-transparent via-gold to-transparent rounded-full"
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scaleX: [1, 1.2, 1],
          }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          style={{
            filter: "blur(8px)",
            boxShadow: "0 0 30px #FFD700",
          }}
        />
      </motion.div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gold rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
            }}
            animate={{
              y: [null, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function Scene3D({ onLoaded, phoneBooted }: Scene3DProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onLoaded()
    }, 1000)
    return () => clearTimeout(timer)
  }, [onLoaded])

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black relative overflow-hidden">
      {/* Background Animation */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "linear-gradient(135deg, #1a0033 0%, #000066 50%, #000000 100%)",
            "linear-gradient(135deg, #000066 0%, #1a0033 50%, #000000 100%)",
            "linear-gradient(135deg, #1a0033 0%, #000066 50%, #000000 100%)",
          ],
        }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
      />

      {/* Main Phone Component */}
      <Phone phoneBooted={phoneBooted} />

      {/* Ambient Lighting Effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(255, 215, 0, 0.1) 0%, transparent 70%)",
        }}
      />
    </div>
  )
}
