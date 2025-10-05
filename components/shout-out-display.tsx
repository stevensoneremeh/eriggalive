"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useShoutOut } from "@/contexts/shout-out-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Mic, Quote } from "lucide-react"
import { cn } from "@/lib/utils"

interface ShoutOutDisplayProps {
  position?: "top" | "bottom"
  className?: string
}

export function ShoutOutDisplay({ position = "top", className }: ShoutOutDisplayProps) {
  const { currentShoutOut, isVisible, hideShoutOut, currentQuote, showingQuote, isSticky } = useShoutOut()

  const shouldShow = isVisible && currentShoutOut
  const shouldShowQuote = showingQuote && !shouldShow

  return (
    <AnimatePresence>
      {(shouldShow || shouldShowQuote) && (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -100 : 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === "top" ? -100 : 100, scale: 0.9 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 200,
            duration: 0.6,
          }}
          className={cn(
            "fixed left-1/2 transform -translate-x-1/2 z-50 max-w-4xl w-full mx-4",
            position === "top" ? "top-16" : "bottom-16",
            isSticky && "sticky",
            className,
          )}
        >
          {shouldShow && currentShoutOut && (
            <Card className="bg-gradient-to-r from-red-500/95 to-orange-500/95 backdrop-blur-md border-2 border-yellow-400/50 shadow-2xl">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Mic className="w-4 h-4 text-white" />
                      <p className="text-white font-bold text-sm uppercase tracking-wide">
                        Live Shout-out from {currentShoutOut.user_name}
                      </p>
                    </div>
                    <div className="overflow-hidden">
                      <motion.p
                        className="text-white text-lg md:text-xl font-medium leading-tight whitespace-nowrap"
                        animate={{
                          x: currentShoutOut.message.length > 30 ? [0, -400, 0] : 0,
                        }}
                        transition={{
                          duration: currentShoutOut.message.length > 30 ? 12 : 0,
                          repeat: currentShoutOut.message.length > 30 ? Number.POSITIVE_INFINITY : 0,
                          ease: "linear",
                        }}
                      >
                        {currentShoutOut.message}
                      </motion.p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={hideShoutOut}
                    className="text-white hover:bg-white/20 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {shouldShowQuote && (
            <Card className="bg-gradient-to-r from-purple-600/90 to-blue-600/90 backdrop-blur-md border-2 border-cyan-400/50 shadow-2xl">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Quote className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-cyan-100 font-bold text-sm uppercase tracking-wide mb-2">Erigga Wisdom</p>
                    <div className="overflow-hidden">
                      <motion.p
                        className="text-white text-lg md:text-xl font-medium leading-tight whitespace-nowrap"
                        animate={{
                          x: currentQuote.length > 25 ? [0, -300, 0] : 0,
                        }}
                        transition={{
                          duration: currentQuote.length > 25 ? 10 : 0,
                          repeat: currentQuote.length > 25 ? Number.POSITIVE_INFINITY : 0,
                          ease: "linear",
                        }}
                      >
                        "{currentQuote}"
                      </motion.p>
                    </div>
                  </div>
                  {isSticky && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={hideShoutOut}
                      className="text-white hover:bg-white/20 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
