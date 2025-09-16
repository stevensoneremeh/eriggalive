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
  "Through all the hurt and the pain we still reach this height",
  "Most of the friendship when end na money decide",
  "Life no difficult na you say you wan rich",
  "We need the muller throway weytin dem wan dey talk",
  "Made it out the trenches, paid what it cost",
  "Always count my blessings 'cause we all gat flaws",
  "Say what it is don't tell me what it was",
  "Pain and the hate, we go still show love",
  "Go for your goals, nowadays nor be better keeper dey",
  "Life na bitch, old tele tele",
  "Your sad stories nobody get time for such and such",
  "All the sacrifices we made to make sure that the world remember my name",
  "We creators, like, we go through the most pains",
  "Na that pain we fit dey channel our energy inside the universe",
  "Seven albums, still strong, day break, everywhere burst",
  "Upon all the things wen we dey go through we still get to give to you",
  "Paper Boi, I dey hustle for the money",
  "Street credibility na my priority",
  "From Warri to the world, we dey represent",
  "Street wisdom pass book knowledge sometimes",
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
