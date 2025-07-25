"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useEffect } from "react"

interface Track {
  id: string
  title: string
  artist: string
  url: string
  duration?: number
}

interface RadioContextType {
  isPlaying: boolean
  currentTrack: Track | null
  volume: number
  isMuted: boolean
  isLoading: boolean
  playlist: Track[]
  currentIndex: number
  play: () => void
  pause: () => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  nextTrack: () => void
  previousTrack: () => void
  playTrack: (track: Track) => void
  setPlaylist: (tracks: Track[]) => void
}

const RadioContext = createContext<RadioContextType | undefined>(undefined)

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [volume, setVolumeState] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [playlist, setPlaylistState] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.volume = volume

    const audio = audioRef.current

    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleEnded = () => {
      setIsPlaying(false)
      nextTrack()
    }
    const handleError = () => {
      setIsLoading(false)
      console.error("Audio playback error")
    }

    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      audio.pause()
    }
  }, [])

  const play = () => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const togglePlay = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const playTrack = (track: Track) => {
    if (audioRef.current) {
      audioRef.current.src = track.url
      setCurrentTrack(track)
      setIsLoading(true)

      // Find track in playlist and update index
      const trackIndex = playlist.findIndex((t) => t.id === track.id)
      if (trackIndex !== -1) {
        setCurrentIndex(trackIndex)
      }

      play()
    }
  }

  const nextTrack = () => {
    if (playlist.length > 0) {
      const nextIndex = (currentIndex + 1) % playlist.length
      setCurrentIndex(nextIndex)
      playTrack(playlist[nextIndex])
    }
  }

  const previousTrack = () => {
    if (playlist.length > 0) {
      const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
      setCurrentIndex(prevIndex)
      playTrack(playlist[prevIndex])
    }
  }

  const setPlaylist = (tracks: Track[]) => {
    setPlaylistState(tracks)
    if (tracks.length > 0 && !currentTrack) {
      setCurrentTrack(tracks[0])
      setCurrentIndex(0)
    }
  }

  const value = {
    isPlaying,
    currentTrack,
    volume,
    isMuted,
    isLoading,
    playlist,
    currentIndex,
    play,
    pause,
    togglePlay,
    setVolume,
    toggleMute,
    nextTrack,
    previousTrack,
    playTrack,
    setPlaylist,
  }

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>
}

export function useRadio() {
  const context = useContext(RadioContext)
  if (context === undefined) {
    throw new Error("useRadio must be used within a RadioProvider")
  }
  return context
}
