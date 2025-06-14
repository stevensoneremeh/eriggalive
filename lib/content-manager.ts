"use client"

import { createClient } from "@/lib/supabase/client"

export interface PostData {
  content: string
  type: "post" | "bars" | "story" | "event"
  media_urls?: string[]
  media_types?: string[]
  thumbnail_urls?: string[]
  tags?: string[]
  mentions?: string[]
  hashtags?: string[]
}

export interface Post {
  id: number
  user_id: string
  content: string
  type: string
  media_urls: string[]
  media_types: string[]
  thumbnail_urls: string[]
  like_count: number
  comment_count: number
  share_count: number
  view_count: number
  created_at: string
  updated_at: string
  is_published: boolean
  is_deleted: boolean
  tags: string[]
  mentions: string[]
  hashtags: string[]
  users?: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    tier: string
    coins: number
  }
}

export class ContentManager {
  private supabase = createClient()

  async createPost(userId: string, postData: PostData): Promise<{ success: boolean; post?: Post; error?: string }> {
    try {
      // Extract hashtags from content
      const hashtags = this.extractHashtags(postData.content)

      // Extract mentions from content
      const mentions = this.extractMentions(postData.content)

      const { data, error } = await this.supabase
        .from("posts")
        .insert({
          user_id: userId,
          content: postData.content,
          type: postData.type,
          media_urls: postData.media_urls || [],
          media_types: postData.media_types || [],
          thumbnail_urls: postData.thumbnail_urls || [],
          tags: postData.tags || [],
          mentions: mentions,
          hashtags: hashtags,
          like_count: 0,
          comment_count: 0,
          share_count: 0,
          view_count: 0,
          is_published: true,
          is_deleted: false,
          is_featured: false,
          is_pinned: false,
        })
        .select(`
          *,
          users:user_id (
            id,
            username,
            full_name,
            avatar_url,
            tier,
            coins
          )
        `)
        .single()

      if (error) throw error

      return { success: true, post: data }
    } catch (error) {
      console.error("Error creating post:", error)
      return { success: false, error: error instanceof Error ? error.message : "Failed to create post" }
    }
  }

  async uploadMedia(file: File, userId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      const filePath = `community/${fileName}`

      const { data, error } = await this.supabase.storage.from("media").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) throw error

      const {
        data: { publicUrl },
      } = this.supabase.storage.from("media").getPublicUrl(filePath)

      return { success: true, url: publicUrl }
    } catch (error) {
      console.error("Error uploading media:", error)
      return { success: false, error: error instanceof Error ? error.message : "Failed to upload media" }
    }
  }

  async getPosts(
    filters: {
      type?: string
      userId?: string
      limit?: number
      offset?: number
      searchQuery?: string
    } = {},
  ): Promise<{ success: boolean; posts?: Post[]; error?: string }> {
    try {
      let query = this.supabase
        .from("posts")
        .select(`
          *,
          users:user_id (
            id,
            username,
            full_name,
            avatar_url,
            tier,
            coins
          )
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })

      if (filters.type && filters.type !== "all") {
        query = query.eq("type", filters.type)
      }

      if (filters.userId) {
        query = query.eq("user_id", filters.userId)
      }

      if (filters.searchQuery) {
        query = query.ilike("content", `%${filters.searchQuery}%`)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, posts: data || [] }
    } catch (error) {
      console.error("Error fetching posts:", error)
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch posts" }
    }
  }

  async likePost(postId: number, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if already liked
      const { data: existingLike } = await this.supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single()

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await this.supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId)

        if (deleteError) throw deleteError

        // Decrement like count
        const { error: updateError } = await this.supabase.rpc("decrement_post_likes", { post_id: postId })

        if (updateError) throw updateError
      } else {
        // Like
        const { error: insertError } = await this.supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: userId })

        if (insertError) throw insertError

        // Increment like count
        const { error: updateError } = await this.supabase.rpc("increment_post_likes", { post_id: postId })

        if (updateError) throw updateError
      }

      return { success: true }
    } catch (error) {
      console.error("Error toggling like:", error)
      return { success: false, error: error instanceof Error ? error.message : "Failed to toggle like" }
    }
  }

  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w]+/g
    const matches = content.match(hashtagRegex)
    return matches ? matches.map((tag) => tag.substring(1)) : []
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@[\w]+/g
    const matches = content.match(mentionRegex)
    return matches ? matches.map((mention) => mention.substring(1)) : []
  }
}

export function useContentManager() {
  const contentManager = new ContentManager()
  return contentManager
}
