import Ably from "ably"

let ablyClient: Ably.Realtime | null = null

export const getAblyClient = (): Ably.Realtime | null => {
  if (typeof window === "undefined") {
    return null // Don't initialize on server side
  }

  if (!ablyClient) {
    const ablyKey = process.env.NEXT_PUBLIC_ABLY_KEY

    if (!ablyKey) {
      console.warn("Ably key not found. Real-time features will be disabled.")
      return null
    }

    try {
      ablyClient = new Ably.Realtime({
        key: ablyKey,
        clientId: `user-${Math.random().toString(36).substr(2, 9)}`,
      })
    } catch (error) {
      console.error("Failed to initialize Ably client:", error)
      return null
    }
  }

  return ablyClient
}

export const closeAblyConnection = () => {
  if (ablyClient) {
    ablyClient.close()
    ablyClient = null
  }
}
