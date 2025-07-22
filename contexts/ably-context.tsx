"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"

interface AblyContextType {
  isConnected: boolean
  subscribeToFeed: (callback: (data: any) => void) => () => void
}

const AblyContext = createContext<AblyContextType | undefined>(undefined)

export function AblyProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Simulate connection status
    const timer = setTimeout(() => {
      setIsConnected(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [user])

  const subscribeToFeed = (callback: (data: any) => void) => {
    // Mock subscription - in real app, this would use Ably
    const interval = setInterval(() => {
      // Simulate receiving data
      if (Math.random() > 0.95) {
        callback({
          type: "message",
          data: { message: "Mock real-time message" },
        })
      }
    }, 5000)

    return () => clearInterval(interval)
  }

  const value = {
    isConnected,
    subscribeToFeed,
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
