"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useEffect } from "react"

type Mood = "hustle" | "street" | "love" | "pain" | "victory" | "reality"

type Track = {
  id: string
  title: string
  artist: string
  url: string
  mood: Mood
}

type RadioContextType = {
  currentMood: Mood | null
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  isMuted: boolean
  isLoading: boolean
  setCurrentMood: (mood: Mood | null) => void
  setIsPlaying: (playing: boolean) => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  nextTrack: () => void
  previousTrack: () => void
}

const RadioContext = createContext<RadioContextType | undefined>(undefined)

const MOOD_TRACKS: Record<Mood, Track[]> = {
  hustle: [
    {
      id: "hustle-1",
      title: "Paper Boi",
      artist: "Erigga",
      url: "/audio/paper-boi.mp3",
      mood: "hustle",
    },
  ],
  street: [
    {
      id: "street-1",
      title: "Street Motivation",
      artist: "Erigga",
      url: "/audio/street-motivation.mp3",
      mood: "street",
    },
  ],
  love: [
    {
      id: "love-1",
      title: "Love Me",
      artist: "Erigga",
      url: "/audio/love-me.mp3",
      mood: "love",
    },
  ],
  pain: [
    {
      id: "pain-1",
      title: "Pain",
      artist: "Erigga",
      url: "/audio/pain.mp3",
      mood: "pain",
    },
  ],
  victory: [
    {
      id: "victory-1",
      title: "Victory",
      artist: "Erigga",
      url: "/audio/victory.mp3",
      mood: "victory",
    },
  ],
  reality: [
    {
      id: "reality-1",
      title: "Reality",
      artist: "Erigga",
      url: "/audio/reality.mp3",
      mood: "reality",
    },
  ],
}

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const [currentMood, setCurrentMood] = useState<Mood | null>(null)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (currentMood) {
      const tracks = MOOD_TRACKS[currentMood]
      if (tracks.length > 0) {
        setCurrentTrack(tracks[0])
        setCurrentTrackIndex(0)
      }
    } else {
      setCurrentTrack(null)
      setCurrentTrackIndex(0)
    }
  }, [currentMood])

  const togglePlay = async () => {
    if (!audioRef.current || !currentTrack) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        setIsLoading(true)
        await audioRef.current.play()
        setIsPlaying(true)
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error playing audio:", error)
      setIsLoading(false)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const nextTrack = () => {
    if (!currentMood) return
    const tracks = MOOD_TRACKS[currentMood]
    const nextIndex = (currentTrackIndex + 1) % tracks.length
    setCurrentTrack(tracks[nextIndex])
    setCurrentTrackIndex(nextIndex)
  }

  const previousTrack = () => {
    if (!currentMood) return
    const tracks = MOOD_TRACKS[currentMood]
    const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1
    setCurrentTrack(tracks[prevIndex])
    setCurrentTrackIndex(prevIndex)
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const value = {
    currentMood,
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    isLoading,
    setCurrentMood,
    setIsPlaying,
    togglePlay,
    setVolume,
    toggleMute,
    nextTrack,
    previousTrack,
  }

  return (
    <RadioContext.Provider value={value}>
      {children}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          onEnded={nextTrack}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setIsPlaying(false)
          }}
        />
      )}
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
