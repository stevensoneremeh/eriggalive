"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useShoutOut } from "@/contexts/shout-out-context"
import { X } from "lucide-react"

interface ShoutOutDisplayProps {
  position?: "top" | "bottom"
}

export function ShoutOutDisplay({ position = "top" }: ShoutOutDisplayProps) {
  const { currentShoutOut, isVisible, hideShoutOut, currentQuote, showingQuote } = useShoutOut()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const positionClasses = position === "top" ? "top-20 md:top-24" : "bottom-4"

  return (
    <AnimatePresence>
      {isVisible && currentShoutOut ? (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -50 : 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === "top" ? -50 : 50 }}
          transition={{ duration: 0.5 }}
          className={`fixed left-0 right-0 z-40 mx-auto max-w-3xl px-4 ${positionClasses}`}
        >
          <div className="relative rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-1 shadow-lg">
            <div className="rounded-md bg-background p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-primary">Shout Out from {currentShoutOut.user_name}</p>
                  <p className="mt-1 text-sm">{currentShoutOut.message}</p>
                </div>
                <button
                  onClick={hideShoutOut}
                  className="ml-4 rounded-full p-1 hover:bg-muted transition-colors"
                  aria-label="Close shout out"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : showingQuote ? (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -50 : 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === "top" ? -50 : 50 }}
          transition={{ duration: 0.5 }}
          className={`fixed left-0 right-0 z-40 mx-auto max-w-2xl px-4 ${positionClasses}`}
        >
          <div className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 p-1 shadow-lg">
            <div className="rounded-md bg-background p-3">
              <p className="text-center text-sm italic">"{currentQuote}"</p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
