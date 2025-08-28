"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Volume2, Heart, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

interface ShoutOut {
  id: string
  message: string
  username: string
  timestamp: Date
  type: "dedication" | "shoutout" | "request"
}

interface EnhancedShoutOutProps {
  currentShoutOut?: ShoutOut | null
  className?: string
}

export function EnhancedShoutOut({ currentShoutOut, className }: EnhancedShoutOutProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [displayDuration, setDisplayDuration] = useState(8000) // 8 seconds default

  useEffect(() => {
    if (currentShoutOut) {
      setIsVisible(true)

      // Enhanced duration based on message length
      const baseTime = FEATURE_UI_FIXES_V1 ? 8000 : 4000
      const extraTime = Math.min(currentShoutOut.message.length * 50, 4000)
      setDisplayDuration(baseTime + extraTime)

      const timer = setTimeout(() => {
        setIsVisible(false)
      }, displayDuration)

      return () => clearTimeout(timer)
    }
  }, [currentShoutOut, displayDuration])

  if (!currentShoutOut) return null

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "dedication":
        return <Heart className="w-4 h-4" />
      case "request":
        return <MessageCircle className="w-4 h-4" />
      default:
        return <Volume2 className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "dedication":
        return "from-red-500 to-pink-500"
      case "request":
        return "from-blue-500 to-purple-500"
      default:
        return "from-green-500 to-emerald-500"
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
            exit: { duration: 0.3 },
          }}
          className={cn(
            "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md mx-auto px-4",
            FEATURE_UI_FIXES_V1 && "md:top-20 md:max-w-lg",
            className,
          )}
        >
          <Card
            className={cn(
              "bg-gradient-to-r shadow-2xl border-2 backdrop-blur-xl",
              getTypeColor(currentShoutOut.type),
              "border-white/20",
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">
                    {getTypeIcon(currentShoutOut.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                      {currentShoutOut.type.toUpperCase()}
                    </Badge>
                    <span className="text-white/80 text-xs font-medium">@{currentShoutOut.username}</span>
                  </div>

                  <motion.p
                    className="text-white font-medium text-sm leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {currentShoutOut.message}
                  </motion.p>
                </div>
              </div>

              {/* Progress bar */}
              {FEATURE_UI_FIXES_V1 && (
                <motion.div
                  className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div
                    className="h-full bg-white/60 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{
                      duration: displayDuration / 1000,
                      ease: "linear",
                    }}
                  />
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Pulse effect */}
          <motion.div
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/10 to-white/5 -z-10"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
