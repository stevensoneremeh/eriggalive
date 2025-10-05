"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface LiveStream {
  id: string
  title: string
  description?: string
  video_url: string
  thumbnail_url?: string
  stream_type: string
  status: string
  is_active: boolean
}

interface LiveStreamContextType {
  currentStream: LiveStream | null
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  refreshStream: () => Promise<void>
}

const LiveStreamContext = createContext<LiveStreamContextType | undefined>(undefined)

export function LiveStreamProvider({ children }: { children: React.ReactNode }) {
  const [currentStream, setCurrentStream] = useState<LiveStream | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const supabase = createClient()

  const refreshStream = async () => {
    try {
      const { data } = await supabase
        .from("live_streams")
        .select("*")
        .eq("status", "active")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setCurrentStream(data as LiveStream)
      } else {
        setCurrentStream(null)
        setIsPlaying(false)
      }
    } catch (error) {
      console.error("Error fetching live stream:", error)
      setCurrentStream(null)
      setIsPlaying(false)
    }
  }

  useEffect(() => {
    refreshStream()

    const channel = supabase
      .channel("live-stream-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_streams",
        },
        (payload: any) => {
          refreshStream()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <LiveStreamContext.Provider
      value={{
        currentStream,
        isPlaying,
        setIsPlaying,
        refreshStream,
      }}
    >
      {children}
    </LiveStreamContext.Provider>
  )
}

export function useLiveStream() {
  const context = useContext(LiveStreamContext)
  if (context === undefined) {
    throw new Error("useLiveStream must be used within a LiveStreamProvider")
  }
  return context
}
