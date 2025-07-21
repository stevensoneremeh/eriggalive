import Ably from "ably"

let ablyClient: Ably.Realtime | null = null

export function getAblyClient(): Ably.Realtime {
  if (!ablyClient) {
    const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY

    if (!apiKey) {
      console.warn("NEXT_PUBLIC_ABLY_API_KEY is not configured. Real-time features will be disabled.")
      throw new Error("Ably API key not configured")
    }

    ablyClient = new Ably.Realtime({
      key: apiKey,
      clientId: typeof window !== "undefined" ? `user-${Math.random().toString(36).substr(2, 9)}` : undefined,
      autoConnect: true,
      recover: true,
    })

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

export const ABLY_CHANNELS = {
  COMMUNITY_FEED: "community:feed",
  POST_VOTES: (postId: number) => `post:${postId}:votes`,
  POST_COMMENTS: (postId: number) => `post:${postId}:comments`,
  USER_NOTIFICATIONS: (userId: string) => `user:${userId}:notifications`,
}

export async function publishEvent(channelName: string, eventName: string, data: any) {
  try {
    const client = getAblyClient()
    const channel = client.channels.get(channelName)
    await channel.publish(eventName, data)
  } catch (error) {
    console.error("Failed to publish event:", error)
  }
}

export function subscribeToChannel(
  channelName: string,
  eventName: string,
  callback: (message: Ably.Message) => void,
): () => void {
  try {
    const client = getAblyClient()
    const channel = client.channels.get(channelName)

    channel.subscribe(eventName, callback)

    return () => {
      channel.unsubscribe(eventName, callback)
    }
  } catch (error) {
    console.error("Failed to subscribe to channel:", error)
    return () => {}
  }
}

export function cleanupAbly() {
  if (ablyClient) {
    ablyClient.close()
    ablyClient = null
  }
}
