import Ably from "ably"

let ably: Ably.Realtime | null = null

export function getAblyClient(): Ably.Realtime {
  if (!ably) {
    if (!process.env.NEXT_PUBLIC_ABLY_API_KEY) {
      throw new Error("NEXT_PUBLIC_ABLY_API_KEY is not set")
    }

    ably = new Ably.Realtime({
      key: process.env.NEXT_PUBLIC_ABLY_API_KEY,
      clientId: typeof window !== "undefined" ? `user-${Date.now()}` : undefined,
    })
  }

  return ably
}

export const ABLY_CHANNELS = {
  COMMUNITY_FEED: "community:feed",
  POST_VOTES: (postId: number) => `post:${postId}:votes`,
  POST_COMMENTS: (postId: number) => `post:${postId}:comments`,
  COMMENT_LIKES: (commentId: number) => `comment:${commentId}:likes`,
} as const

export type AblyEventTypes = {
  "post:created": {
    post: any
    categoryId?: number
  }
  "post:voted": {
    postId: number
    voteCount: number
    voted: boolean
    userId: number
  }
  "comment:created": {
    postId: number
    comment: any
  }
  "comment:liked": {
    commentId: number
    likeCount: number
    liked: boolean
    userId: number
  }
}

export function publishEvent<T extends keyof AblyEventTypes>(channel: string, eventType: T, data: AblyEventTypes[T]) {
  try {
    const client = getAblyClient()
    const channelInstance = client.channels.get(channel)
    channelInstance.publish(eventType, data)
  } catch (error) {
    console.error("Failed to publish Ably event:", error)
  }
}
