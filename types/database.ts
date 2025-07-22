export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserTier = "grassroot" | "pioneer" | "elder" | "blood_brotherhood" | "admin"
export type UserRole = "user" | "moderator" | "admin" | "super_admin"
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "incomplete" | "trialing"
export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded" | "canceled"
export type TransactionType = "purchase" | "withdrawal" | "reward" | "content_access" | "refund" | "bonus"
export type PaymentMethod = "paystack" | "flutterwave" | "crypto" | "coins" | "bank_transfer"
export type ContentType = "video" | "audio" | "image" | "document" | "live_stream"
export type PostType = "bars" | "story" | "event" | "general" | "announcement" | "poll"
export type AlbumType = "album" | "ep" | "mixtape" | "single" | "compilation"
export type TicketStatus = "confirmed" | "pending" | "canceled" | "used" | "expired"
export type NotificationType = "system" | "content" | "social" | "payment" | "event" | "tier_upgrade"
export type ReportReason = "spam" | "harassment" | "hate_speech" | "misinformation" | "inappropriate_content" | "other"
export type ReportTargetType = "post" | "comment"

export interface User {
  id: string
  auth_user_id: string
  username: string
  full_name: string | null
  display_name: string | null
  email: string
  avatar_url: string | null
  tier: string
  coins_balance: number
  level: number
  points: number
  is_active: boolean
  is_verified: boolean
  is_banned: boolean
  created_at: string
  updated_at: string
}

export interface CommunityCategory {
  id: number
  name: string
  slug: string
  description: string | null
  icon?: string
  color?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommunityPost {
  id: string
  user_id: string
  title: string | null
  content: string
  media_url: string | null
  media_type: string | null
  category_id: string | null
  upvotes: number
  downvotes: number
  comments_count: number
  is_pinned: boolean
  is_locked: boolean
  created_at: string
  updated_at: string
  // Joined data
  user?: Pick<User, "id" | "auth_user_id" | "username" | "full_name" | "avatar_url" | "tier">
  category?: Pick<CommunityCategory, "id" | "name" | "slug">
  has_voted?: boolean
  comments?: CommunityComment[]
}

export interface CommunityPostVote {
  post_id: number
  user_id: number
  created_at: string
}

export interface CommunityComment {
  id: string
  post_id: string
  user_id: string
  content: string
  parent_id: string | null
  upvotes: number
  downvotes: number
  created_at: string
  updated_at: string
  // Joined data
  user?: Pick<User, "id" | "auth_user_id" | "username" | "full_name" | "avatar_url" | "tier">
  replies?: CommunityComment[]
  has_liked?: boolean
}

export interface CommunityCommentLike {
  comment_id: number
  user_id: number
  created_at: string
}

export interface CommunityReport {
  id: number
  reporter_user_id: number
  target_id: number
  target_type: ReportTargetType
  reason: ReportReason
  additional_notes?: string
  is_resolved: boolean
  resolved_by?: string
  resolved_at?: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: {
          id?: string
          auth_user_id: string
          username: string
          full_name?: string | null
          display_name?: string | null
          email: string
          avatar_url?: string | null
          tier?: string
          coins_balance?: number
          level?: number
          points?: number
          is_active?: boolean
          is_verified?: boolean
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          username?: string
          full_name?: string | null
          display_name?: string | null
          email?: string
          avatar_url?: string | null
          tier?: string
          coins_balance?: number
          level?: number
          points?: number
          is_active?: boolean
          is_verified?: boolean
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_categories: {
        Row: CommunityCategory
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: CommunityPost
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content: string
          media_url?: string | null
          media_type?: string | null
          category_id?: string | null
          upvotes?: number
          downvotes?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: string
          media_url?: string | null
          media_type?: string | null
          category_id?: string | null
          upvotes?: number
          downvotes?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: CommunityComment
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          parent_id?: string | null
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          parent_id?: string | null
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          room: string
          content: string
          upvotes: number
          downvotes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          room: string
          content: string
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          room?: string
          content?: string
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      freebies_posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          media_url: string | null
          media_type: string | null
          upvotes: number
          downvotes: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          media_url?: string | null
          media_type?: string | null
          upvotes?: number
          downvotes?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          media_url?: string | null
          media_type?: string | null
          upvotes?: number
          downvotes?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "freebies_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
