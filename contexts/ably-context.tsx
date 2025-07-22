"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getAblyClient, subscribeToChannel, publishEvent, ABLY_CHANNELS } from "@/lib/ably"
import { useAuth } from "@/contexts/auth-context"

interface AblyContextType {
  isConnected: boolean
  subscribeToFeed: (callback: (data: any) => void) => () => void
  subscribeToPostVotes: (postId: number, callback: (data: any) => void) => () => void
  publishToFeed: (data: any) => Promise<void>
  publishVoteUpdate: (postId: number, data: any) => Promise<void>
}

const AblyContext = createContext<AblyContextType | undefined>(undefined)

export function AblyProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return

    try {
      const client = getAblyClient()

      client.connection.on("connected", () => {
        setIsConnected(true)
      })

      client.connection.on("disconnected", () => {
        setIsConnected(false)
      })

      client.connection.on("failed", () => {
        setIsConnected(false)
      })

      // Initial connection state
      setIsConnected(client.connection.state === "connected")
    } catch (error) {
      console.error("Failed to initialize Ably:", error)
      setIsConnected(false)
    }
  }, [isAuthenticated])

  const subscribeToFeed = (callback: (data: any) => void) => {
    return subscribeToChannel(ABLY_CHANNELS.COMMUNITY_FEED, "post:created", (message) => {
      callback(message.data)
    })
  }

  const subscribeToPostVotes = (postId: number, callback: (data: any) => void) => {
    return subscribeToChannel(ABLY_CHANNELS.POST_VOTES(postId), "vote:updated", (message) => {
      callback(message.data)
    })
  }

  const publishToFeed = async (data: any) => {
    await publishEvent(ABLY_CHANNELS.COMMUNITY_FEED, "post:created", data)
  }

  const publishVoteUpdate = async (postId: number, data: any) => {
    await publishEvent(ABLY_CHANNELS.POST_VOTES(postId), "vote:updated", data)
  }

  const value = {
    isConnected,
    subscribeToFeed,
    subscribeToPostVotes,
    publishToFeed,
    publishVoteUpdate,
  }

  return <AblyContext.Provider value={value}>{children}</AblyContext.Provider>
}

export function useAbly() {
  const context = useContext(AblyContext)
  if (context === undefined) {
    throw new Error("useAbly must be used within an AblyProvider")
  }
  return context
}
