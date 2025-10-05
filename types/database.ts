export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

<<<<<<< HEAD
export type UserTier = "grassroot" | "pioneer" | "elder" | "blood_brotherhood" | "admin"
=======
export type UserTier = "erigga_citizen" | "erigga_indigen" | "enterprise"
>>>>>>> new
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
<<<<<<< HEAD
  id: number
=======
  id: string
>>>>>>> new
  auth_user_id: string
  username: string
  full_name: string | null
  email: string
  avatar_url: string | null
<<<<<<< HEAD
  tier: UserTier
=======
  profile_image_url: string | null
  tier: UserTier
  subscription_tier: UserTier
>>>>>>> new
  role: UserRole
  level: number
  points: number
  coins: number
<<<<<<< HEAD
  erigga_id?: string
  bio: string | null
  location?: string
  wallet_address?: string
  phone_number?: string
=======
  coins_balance: number
  erigga_id?: string
  bio: string | null
  location?: string
  website?: string
  phone?: string
>>>>>>> new
  date_of_birth?: string
  gender?: string
  is_verified: boolean
  is_active: boolean
  is_banned: boolean
  ban_reason?: string
  banned_until?: string
  last_login?: string
<<<<<<< HEAD
  login_count: number
  referral_code?: string
  referred_by?: number
=======
  last_seen_at?: string
  login_count: number
  referral_code?: string
  referred_by?: string
>>>>>>> new
  subscription_expires_at?: string
  email_verified: boolean
  phone_verified: boolean
  two_factor_enabled: boolean
  two_factor_secret?: string
  preferences: Record<string, any>
<<<<<<< HEAD
  metadata: Record<string, any>
=======
  social_links: Record<string, any>
  metadata: Record<string, any>
  profile_completeness: number
  reputation_score: number
  total_posts: number
  total_comments: number
  total_votes_received: number
  is_profile_public: boolean
>>>>>>> new
  created_at: string
  updated_at: string
}

export interface CommunityCategory {
<<<<<<< HEAD
  id: number
=======
  id: string
>>>>>>> new
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

<<<<<<< HEAD
export interface CommunityPost {
  id: number
  user_id: number
  category_id: number
=======
export interface CommunityPostRow {
  id: string
  user_id: string
  category_id: string
>>>>>>> new
  title: string | null
  content: string
  media_url: string | null
  media_type: string | null
  vote_count: number
  comment_count: number
<<<<<<< HEAD
  is_pinned: boolean
  is_locked: boolean
  tags?: string[]
  mentions?: { user_id: string; username: string; position: number }[]
=======
  hashtags: string[]
  tags: string[]
  mentions: { user_id: string; username: string; position: number }[]
>>>>>>> new
  is_published: boolean
  is_edited: boolean
  is_deleted: boolean
  deleted_at?: string
  created_at: string
  updated_at: string
<<<<<<< HEAD
  // Joined data
  user?: Pick<User, "id" | "auth_user_id" | "username" | "full_name" | "avatar_url" | "tier">
  category?: Pick<CommunityCategory, "id" | "name" | "slug">
  has_voted?: boolean
=======
}

export interface CommunityPost extends CommunityPostRow {
  user?: Pick<User, "id" | "auth_user_id" | "username" | "full_name" | "avatar_url" | "profile_image_url" | "tier">
  category?: Pick<CommunityCategory, "id" | "name" | "slug" | "color" | "icon">
  has_voted?: boolean
  user_voted?: boolean
>>>>>>> new
  comments?: CommunityComment[]
}

export interface CommunityPostVote {
<<<<<<< HEAD
  post_id: number
  user_id: number
=======
  post_id: string
  user_id: string
>>>>>>> new
  created_at: string
}

export interface CommunityComment {
<<<<<<< HEAD
  id: number
  post_id: number
  user_id: number
  parent_id: number | null
  content: string
  vote_count: number
=======
  id: string
  post_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
>>>>>>> new
  like_count: number
  reply_count: number
  is_edited: boolean
  is_deleted: boolean
  deleted_at?: string
  created_at: string
  updated_at: string
<<<<<<< HEAD
  // Joined data
  user?: Pick<User, "id" | "auth_user_id" | "username" | "full_name" | "avatar_url" | "tier">
=======
  user?: Pick<User, "id" | "auth_user_id" | "username" | "full_name" | "avatar_url" | "profile_image_url" | "tier">
>>>>>>> new
  replies?: CommunityComment[]
  has_liked?: boolean
}

export interface CommunityCommentLike {
<<<<<<< HEAD
  comment_id: number
  user_id: number
=======
  comment_id: string
  user_id: string
>>>>>>> new
  created_at: string
}

export interface CommunityReport {
<<<<<<< HEAD
  id: number
  reporter_user_id: number
  target_id: number
=======
  id: string
  reporter_user_id: string
  target_id: string
>>>>>>> new
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
<<<<<<< HEAD
          id?: number
=======
          id?: string
>>>>>>> new
          auth_user_id: string
          username: string
          full_name?: string | null
          email: string
          tier?: UserTier
<<<<<<< HEAD
          role?: UserRole
          coins?: number
          level?: number
          points?: number
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          phone_number?: string | null
          is_verified?: boolean
          is_active?: boolean
          is_banned?: boolean
          email_verified?: boolean
          phone_verified?: boolean
          two_factor_enabled?: boolean
          login_count?: number
          preferences?: Record<string, any>
          metadata?: Record<string, any>
=======
          subscription_tier?: UserTier
          coins?: number
          coins_balance?: number
          level?: number
          points?: number
          avatar_url?: string | null
          profile_image_url?: string | null
          bio?: string | null
          is_verified?: boolean
          is_active?: boolean
          is_banned?: boolean
          reputation_score?: number
          profile_completeness?: number
>>>>>>> new
          created_at?: string
          updated_at?: string
        }
        Update: {
<<<<<<< HEAD
          id?: number
=======
          id?: string
>>>>>>> new
          auth_user_id?: string
          username?: string
          full_name?: string | null
          email?: string
          tier?: UserTier
<<<<<<< HEAD
          role?: UserRole
          coins?: number
          level?: number
          points?: number
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          phone_number?: string | null
          is_verified?: boolean
          is_active?: boolean
          is_banned?: boolean
          email_verified?: boolean
          phone_verified?: boolean
          two_factor_enabled?: boolean
          login_count?: number
          preferences?: Record<string, any>
          metadata?: Record<string, any>
=======
          subscription_tier?: UserTier
          coins?: number
          coins_balance?: number
          level?: number
          points?: number
          avatar_url?: string | null
          profile_image_url?: string | null
          bio?: string | null
          is_verified?: boolean
          is_active?: boolean
          is_banned?: boolean
          reputation_score?: number
          profile_completeness?: number
>>>>>>> new
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_categories: {
        Row: CommunityCategory
        Insert: {
<<<<<<< HEAD
          id?: number
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          color?: string | null
=======
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string
          color?: string
>>>>>>> new
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
<<<<<<< HEAD
          id?: number
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          color?: string | null
=======
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string
          color?: string
>>>>>>> new
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_posts: {
<<<<<<< HEAD
        Row: CommunityPost
        Insert: {
          id?: number
          user_id: number
          category_id: number
=======
        Row: CommunityPostRow
        Insert: {
          id?: string
          user_id: string
          category_id: string
>>>>>>> new
          title?: string | null
          content: string
          media_url?: string | null
          media_type?: string | null
          vote_count?: number
          comment_count?: number
<<<<<<< HEAD
          is_pinned?: boolean
          is_locked?: boolean
          tags?: string[]
=======
          hashtags?: string[]
          tags?: string[]
          mentions?: { user_id: string; username: string; position: number }[]
>>>>>>> new
          is_published?: boolean
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
<<<<<<< HEAD
          id?: number
          user_id?: number
          category_id?: number
=======
          id?: string
          user_id?: string
          category_id?: string
>>>>>>> new
          title?: string | null
          content?: string
          media_url?: string | null
          media_type?: string | null
          vote_count?: number
          comment_count?: number
<<<<<<< HEAD
          is_pinned?: boolean
          is_locked?: boolean
          tags?: string[]
=======
          hashtags?: string[]
          tags?: string[]
          mentions?: { user_id: string; username: string; position: number }[]
>>>>>>> new
          is_published?: boolean
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "community_categories"
            referencedColumns: ["id"]
          },
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
<<<<<<< HEAD
          id?: number
          post_id: number
          user_id: number
          parent_id?: number | null
          content: string
          vote_count?: number
          like_count?: number
          reply_count?: number
          is_edited?: boolean
          is_deleted?: boolean
=======
          id?: string
          post_id: string
          user_id: string
          parent_comment_id?: string | null
          content: string
          like_count?: number
          reply_count?: number
>>>>>>> new
          created_at?: string
          updated_at?: string
        }
        Update: {
<<<<<<< HEAD
          id?: number
          post_id?: number
          user_id?: number
          parent_id?: number | null
          content?: string
          vote_count?: number
          like_count?: number
          reply_count?: number
          is_edited?: boolean
          is_deleted?: boolean
=======
          id?: string
          post_id?: string
          user_id?: string
          parent_comment_id?: string | null
          content?: string
          like_count?: number
          reply_count?: number
>>>>>>> new
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
<<<<<<< HEAD
            foreignKeyName: "community_comments_parent_id_fkey"
            columns: ["parent_id"]
=======
            foreignKeyName: "community_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
>>>>>>> new
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
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
<<<<<<< HEAD
      community_votes: {
        Row: {
          id: number
          user_id: number
          post_id: number | null
          comment_id: number | null
          vote_type: "up" | "down"
          created_at: string
        }
        Insert: {
          id?: number
          user_id: number
          post_id?: number | null
          comment_id?: number | null
          vote_type: "up" | "down"
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          post_id?: number | null
          comment_id?: number | null
          vote_type?: "up" | "down"
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          id: number
          post_id: string
          user_id: number
          created_at: string
        }
        Insert: {
          id?: number
          post_id: string
          user_id: number
          created_at?: string
        }
        Update: {
          id?: number
          post_id?: string
          user_id?: number
          created_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          author_id: number
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: number
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: number
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
=======
>>>>>>> new
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
<<<<<<< HEAD
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
=======
      get_community_posts_with_user_data: {
        Args: {
          category_filter?: string
        }
        Returns: {
          id: string
          user_id: string
          category_id: string
          title: string
          content: string
          media_url: string | null
          media_type: string | null
          vote_count: number
          comment_count: number
          created_at: string
          updated_at: string
          username: string
          full_name: string
          avatar_url: string | null
          tier: string
          category_name: string
          category_color: string
          category_icon: string
          user_voted: boolean
        }[]
      }
      toggle_post_vote: {
        Args: {
          post_id_param: string
        }
        Returns: Json
      }
    }
    Enums: {
      user_tier: "erigga_citizen" | "erigga_indigen" | "enterprise"
      user_role: "user" | "moderator" | "admin" | "super_admin"
      report_reason: "spam" | "harassment" | "hate_speech" | "misinformation" | "inappropriate_content" | "other"
      report_target_type: "post" | "comment"
>>>>>>> new
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
