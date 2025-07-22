"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import Ably from "ably"

interface AblyContextType {
  client: Ably.Realtime | null
  isConnected: boolean
}

const AblyContext = createContext<AblyContextType>({
  client: null,
  isConnected: false,
})

export const useAbly = () => {
  const context = useContext(AblyContext)
  if (!context) {
    throw new Error("useAbly must be used within an AblyProvider")
  }
  return context
}

interface AblyProviderProps {
  children: ReactNode
}

export const AblyProvider: React.FC<AblyProviderProps> = ({ children }) => {
  const [client, setClient] = useState<Ably.Realtime | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const ablyKey = process.env.NEXT_PUBLIC_ABLY_KEY

    if (!ablyKey) {
      console.warn("Ably key not found. Real-time features will be disabled.")
      return
    }

    try {
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

      ablyClient.connection.on("failed", (error) => {
        setIsConnected(false)
        console.error("Ably connection failed:", error)
      })

      setClient(ablyClient)

      return () => {
        ablyClient.close()
      }
    } catch (error) {
      console.error("Failed to initialize Ably client:", error)
    }
  }, [])

  return <AblyContext.Provider value={{ client, isConnected }}>{children}</AblyContext.Provider>
}
