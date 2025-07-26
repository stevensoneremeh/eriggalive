"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface RadioContextType {
  currentMood: string | null
  setCurrentMood: (mood: string | null) => void
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  currentTrack: string | null
  setCurrentTrack: (track: string | null) => void
  isMinimized: boolean
  setIsMinimized: (minimized: boolean) => void
}

const RadioContext = createContext<RadioContextType | undefined>(undefined)

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const [currentMood, setCurrentMood] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  // Persist radio state in localStorage
  useEffect(() => {
    const savedMood = localStorage.getItem("erigga-radio-mood")
    const savedPlaying = localStorage.getItem("erigga-radio-playing")

    if (savedMood) {
      setCurrentMood(savedMood)
    }
    if (savedPlaying === "true") {
      setIsPlaying(true)
    }
  }, [])

  useEffect(() => {
    if (currentMood) {
      localStorage.setItem("erigga-radio-mood", currentMood)
    } else {
      localStorage.removeItem("erigga-radio-mood")
    }
  }, [currentMood])

  useEffect(() => {
    localStorage.setItem("erigga-radio-playing", isPlaying.toString())
  }, [isPlaying])

  return (
    <RadioContext.Provider
      value={{
        currentMood,
        setCurrentMood,
        isPlaying,
        setIsPlaying,
        currentTrack,
        setCurrentTrack,
        isMinimized,
        setIsMinimized,
      }}
    >
      {children}
    </RadioContext.Provider>
  )
}

export function useRadio() {
  const context = useContext(RadioContext)
  if (context === undefined) {
    throw new Error("useRadio must be used within a RadioProvider")
  }
  return context
}
