"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface ShoutOut {
  id: string
  message: string
  user_name: string
  created_at: string
}

interface ShoutOutContextType {
  currentShoutOut: ShoutOut | null
  isVisible: boolean
  showShoutOut: (shoutOut: ShoutOut) => void
  hideShoutOut: () => void
}

const ShoutOutContext = createContext<ShoutOutContextType | undefined>(undefined)

// Erigga-inspired quotes for fallback display (generic phrases inspired by themes, not direct lyrics)
const erigga_quotes = [
  "Hustle hard, no time to waste",
  "From the streets to the stage",
  "Real ones know the struggle",
  "Stay focused on the grind",
  "Paper chase never stops",
  "Warri no dey carry last",
  "Dreams bigger than obstacles",
  "Success is the only option",
  "Respect the journey",
  "True wisdom comes from experience",
]

export function ShoutOutProvider({ children }: { children: React.ReactNode }) {
  const [currentShoutOut, setCurrentShoutOut] = useState<ShoutOut | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [currentQuote, setCurrentQuote] = useState("")
  const [showingQuote, setShowingQuote] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const rotateQuote = () => {
      const randomQuote = erigga_quotes[Math.floor(Math.random() * erigga_quotes.length)]
      setCurrentQuote(randomQuote)
    }

    // Initial quote
    rotateQuote()

    // Rotate quotes every 30 seconds when no shout-out is showing
    const quoteInterval = setInterval(() => {
      if (!currentShoutOut && !isVisible) {
        rotateQuote()
        setShowingQuote(true)

        // Hide quote after 8 seconds
        setTimeout(() => {
          setShowingQuote(false)
        }, 8000)
      }
    }, 30000)

    return () => clearInterval(quoteInterval)
  }, [currentShoutOut, isVisible])

  useEffect(() => {
    const channel = supabase
      .channel("shout-outs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "fan_shoutouts",
        },
        (payload) => {
          if (payload.new) {
            const newShoutOut: ShoutOut = {
              id: payload.new.id,
              message: payload.new.message,
              user_name: payload.new.user_name || "Anonymous Fan",
              created_at: payload.new.created_at,
            }
            showShoutOut(newShoutOut)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const showShoutOut = useCallback((shoutOut: ShoutOut) => {
    setCurrentShoutOut(shoutOut)
    setIsVisible(true)
    setShowingQuote(false)

    // Hide shout-out after 10 minutes (600 seconds) - increased from 5 minutes
    setTimeout(() => {
      setIsVisible(false)
      setCurrentShoutOut(null)
    }, 600000) // 10 minutes
  }, [])

  const hideShoutOut = useCallback(() => {
    setIsVisible(false)
    setCurrentShoutOut(null)
  }, [])

  const contextValue: ShoutOutContextType & { currentQuote: string; showingQuote: boolean } = {
    currentShoutOut,
    isVisible,
    showShoutOut,
    hideShoutOut,
    currentQuote,
    showingQuote,
  }

  return <ShoutOutContext.Provider value={contextValue}>{children}</ShoutOutContext.Provider>
}

export function useShoutOut() {
  const context = useContext(ShoutOutContext)
  if (context === undefined) {
    throw new Error("useShoutOut must be used within a ShoutOutProvider")
  }
  return context as ShoutOutContextType & { currentQuote: string; showingQuote: boolean }
}
