"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import Ably from "ably"

interface AblyContextType {
  ably: Ably.Realtime | null
  isConnected: boolean
}

const AblyContext = createContext<AblyContextType>({
  ably: null,
  isConnected: false,
})

export const useAbly = () => {
  const context = useContext(AblyContext)
  if (!context) {
    throw new Error("useAbly must be used within an AblyProvider")
  }
  return context
}

export function AblyProvider({ children }: { children: React.ReactNode }) {
  const [ably, setAbly] = useState<Ably.Realtime | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const ablyKey = process.env.NEXT_PUBLIC_ABLY_KEY

    if (!ablyKey) {
      console.warn("Ably key not found. Real-time features will be disabled.")
      return
    }

    const ablyInstance = new Ably.Realtime({
      key: ablyKey,
      clientId: `user-${Math.random().toString(36).substr(2, 9)}`,
    })

    ablyInstance.connection.on("connected", () => {
      setIsConnected(true)
    })

    ablyInstance.connection.on("disconnected", () => {
      setIsConnected(false)
    })

    setAbly(ablyInstance)

    return () => {
      ablyInstance.close()
    }
  }, [])

  return <AblyContext.Provider value={{ ably, isConnected }}>{children}</AblyContext.Provider>
}
