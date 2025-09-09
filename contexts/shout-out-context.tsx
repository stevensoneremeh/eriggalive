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

const erigga_quotes = [
  "Paper Boi, I dey hustle for the money",
  "Street credibility na my priority",
  "From Warri to the world, we dey represent",
  "No be by mouth, na by action we dey show",
  "Hustle hard, pray harder, that's the motto",
  "Real recognize real, fake recognize fake",
  "Street wisdom pass book knowledge sometimes",
  "Money no be everything but everything need money",
  "Stay focused, stay blessed, stay grinding",
  "From the streets to the top, we never forget where we come from",
  "Na God dey make person, no be man",
  "If you no get money, you no get voice",
  "Area scatter, but we still dey stand strong",
  "Motivation na the key to success",
  "Delta State, we dey rep am well well",
  "No dulling, we dey move with purpose",
  "Street don teach me say life no balance",
  "Make you no forget where you come from",
  "Warri boys, we no dey carry last",
  "Success na journey, no be destination",
]

export function ShoutOutProvider({ children }: { children: React.ReactNode }) {
  const [currentShoutOut, setCurrentShoutOut] = useState<ShoutOut | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [currentQuote, setCurrentQuote] = useState("")
  const [showingQuote, setShowingQuote] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const rotateQuote = () => {
      const randomQuote = erigga_quotes[Math.floor(Math.random() * erigga_quotes.length)]
      setCurrentQuote(randomQuote)
    }

    // Initial quote
    rotateQuote()

    const quoteInterval = setInterval(() => {
      if (!currentShoutOut && !isVisible) {
        rotateQuote()
        setShowingQuote(true)
        setIsSticky(true)

        setTimeout(() => {
          setShowingQuote(false)
          setIsSticky(false)
        }, 15000)
      }
    }, 20000) // Show every 20 seconds

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
    setIsSticky(true)

    setTimeout(() => {
      setIsVisible(false)
      setCurrentShoutOut(null)
      setIsSticky(false)
    }, 600000)
  }, [])

  const hideShoutOut = useCallback(() => {
    setIsVisible(false)
    setCurrentShoutOut(null)
    setIsSticky(false)
  }, [])

  const contextValue: ShoutOutContextType & { currentQuote: string; showingQuote: boolean; isSticky: boolean } = {
    currentShoutOut,
    isVisible,
    showShoutOut,
    hideShoutOut,
    currentQuote,
    showingQuote,
    isSticky,
  }

  return <ShoutOutContext.Provider value={contextValue}>{children}</ShoutOutContext.Provider>
}

export function useShoutOut() {
  const context = useContext(ShoutOutContext)
  if (context === undefined) {
    throw new Error("useShoutOut must be used within a ShoutOutProvider")
  }
  return context as ShoutOutContextType & { currentQuote: string; showingQuote: boolean; isSticky: boolean }
}
