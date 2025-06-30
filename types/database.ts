export type UserTier = "grassroot" | "pioneer" | "elder" | "blood" | "admin"
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
  id: number
  auth_user_id: string
  username: string
  full_name: string
  email: string
  avatar_url?: string
  cover_image_url?: string
  tier: UserTier
  role: UserRole
  level: number
  points: number
  coins: number
  erigga_id?: string
  bio?: string
  location?: string
  wallet_address?: string
  phone_number?: string
  date_of_birth?: string
  gender?: string
  is_verified: boolean
  is_active: boolean
  is_banned: boolean
  ban_reason?: string
  banned_until?: string
  last_login?: string
  login_count: number
  referral_code?: string
  referred_by?: number
  subscription_expires_at?: string
  email_verified: boolean
  phone_verified: boolean
  two_factor_enabled: boolean
  two_factor_secret?: string
  preferences: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CommunityCategory {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommunityPost {
  id: number
  user_id: number
  category_id: number
  content: string
  media_url?: string
  media_type?: "image" | "audio" | "video"
  media_metadata?: Record<string, any>
  vote_count: number
  comment_count: number
  tags?: string[]
  mentions?: { user_id: string; username: string; position: number }[]
  is_published: boolean
  is_edited: boolean
  is_deleted: boolean
  deleted_at?: string
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
  id: number
  post_id: number
  user_id: number
  parent_comment_id?: number | null
  content: string
  like_count: number
  reply_count: number
  is_edited: boolean
  is_deleted: boolean
  deleted_at?: string
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
        Insert: Partial<User>
        Update: Partial<User>
      }
      community_categories: {
        Row: CommunityCategory
        Insert: Omit<CommunityCategory, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<CommunityCategory, "id" | "created_at" | "updated_at">>
      }
      community_posts: {
        Row: CommunityPost
        Insert: Omit<
          CommunityPost,
          | "id"
          | "vote_count"
          | "comment_count"
          | "created_at"
          | "updated_at"
          | "is_published"
          | "is_deleted"
          | "is_edited"
          | "user"
          | "category"
          | "has_voted"
          | "comments"
        > & { user_id: number }
        Update: Partial<
          Omit<
            CommunityPost,
            "id" | "user_id" | "created_at" | "updated_at" | "user" | "category" | "has_voted" | "comments"
          >
        >
      }
      community_post_votes: {
        Row: CommunityPostVote
        Insert: CommunityPostVote & { user_id: number }
        Update: never
      }
      community_comments: {
        Row: CommunityComment
        Insert: Omit<
          CommunityComment,
          | "id"
          | "like_count"
          | "reply_count"
          | "created_at"
          | "updated_at"
          | "is_deleted"
          | "is_edited"
          | "user"
          | "replies"
          | "has_liked"
        > & { user_id: number }
        Update: Partial<
          Omit<
            CommunityComment,
            "id" | "user_id" | "post_id" | "created_at" | "updated_at" | "user" | "replies" | "has_liked"
          >
        >
      }
      community_comment_likes: {
        Row: CommunityCommentLike
        Insert: CommunityCommentLike & { user_id: number }
        Update: never
      }
      community_reports: {
        Row: CommunityReport
        Insert: Omit<CommunityReport, "id" | "created_at" | "is_resolved" | "resolved_by" | "resolved_at"> & {
          reporter_user_id: number
        }
        Update: Partial<Pick<CommunityReport, "is_resolved" | "resolved_by" | "resolved_at">>
      }
    }
    Functions: {
      increment_post_votes: {
        Args: { post_id: number }
        Returns: void
      }
      decrement_post_votes: {
        Args: { post_id: number }
        Returns: void
      }
      handle_post_vote: {
        Args: {
          p_post_id: number
          p_voter_auth_id: string
          p_post_creator_auth_id: string
          p_coin_amount: number
        }
        Returns: boolean
      }
    }
    Enums: {
      report_reason: ReportReason
      report_target_type: ReportTargetType
      user_tier: UserTier
      user_role: UserRole
    }
  }
}
