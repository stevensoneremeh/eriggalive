import Ably from "ably"

// Ably client instance
let ablyClient: Ably.Realtime | null = null

export function getAblyClient(): Ably.Realtime {
  if (!ablyClient) {
    const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY

    if (!apiKey) {
      throw new Error("NEXT_PUBLIC_ABLY_API_KEY is not configured")
    }

    ablyClient = new Ably.Realtime({
      key: apiKey,
      clientId: `user-${Math.random().toString(36).substr(2, 9)}`,
      autoConnect: true,
      recover: true,
    })

    // Handle connection state changes
    ablyClient.connection.on("connected", () => {
      console.log("Ably: Connected to real-time service")
    })

    ablyClient.connection.on("disconnected", () => {
      console.log("Ably: Disconnected from real-time service")
    })

    ablyClient.connection.on("failed", (error) => {
      console.error("Ably: Connection failed:", error)
    })
  }

  return ablyClient
}

// Channel names
export const ABLY_CHANNELS = {
  COMMUNITY_FEED: "community:feed",
  POST_VOTES: (postId: number) => `post:${postId}:votes`,
  POST_COMMENTS: (postId: number) => `post:${postId}:comments`,
  USER_NOTIFICATIONS: (userId: string) => `user:${userId}:notifications`,
}

// Publish event helper
export async function publishEvent(channelName: string, eventName: string, data: any) {
  try {
    const client = getAblyClient()
    const channel = client.channels.get(channelName)
    await channel.publish(eventName, data)
  } catch (error) {
    console.error("Failed to publish event:", error)
    throw error
  }
}

// Subscribe to channel helper
export function subscribeToChannel(
  channelName: string,
  eventName: string,
  callback: (message: Ably.Message) => void,
): () => void {
  try {
    const client = getAblyClient()
    const channel = client.channels.get(channelName)

    channel.subscribe(eventName, callback)

    // Return unsubscribe function
    return () => {
      channel.unsubscribe(eventName, callback)
    }
  } catch (error) {
    console.error("Failed to subscribe to channel:", error)
    // Return no-op function if subscription fails
    return () => {}
  }
}

// Cleanup function
export function cleanupAbly() {
  if (ablyClient) {
    ablyClient.close()
    ablyClient = null
  }
}
