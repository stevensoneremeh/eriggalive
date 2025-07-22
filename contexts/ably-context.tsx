"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import Ably from "ably"

interface AblyContextType {
  client: Ably.Realtime | null
  isConnected: boolean
}

const AblyContext = createContext<AblyContextType | undefined>(undefined)

export function AblyProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Ably.Realtime | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Only initialize Ably if we have the key
    const ablyKey = process.env.NEXT_PUBLIC_ABLY_KEY

    if (!ablyKey) {
      console.warn("Ably key not found. Real-time features will be disabled.")
      return
    }

    const ablyClient = new Ably.Realtime({
      key: ablyKey,
      clientId: `user-${Math.random().toString(36).substr(2, 9)}`,
    })

    ablyClient.connection.on("connected", () => {
      setIsConnected(true)
      console.log("Connected to Ably")
    })

    ablyClient.connection.on("disconnected", () => {
      setIsConnected(false)
      console.log("Disconnected from Ably")
    })

    setClient(ablyClient)

    return () => {
      ablyClient.close()
    }
  }, [])

  const value = {
    client,
    isConnected,
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
