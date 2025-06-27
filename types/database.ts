export type UserTier = "grassroot" | "pioneer" | "elder" | "blood"
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

export interface User {
  id: number
  auth_user_id: string
  username: string
  full_name: string
  email: string
  avatar_url?: string
  cover_image_url?: string
  tier: UserTier
  tier_id?: number
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

export interface Tier {
  id: number
  name: string
  slug: string
  description?: string
  price: number
  benefits: string[]
  rank: number
  is_active: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Payment {
  id: number
  user_id: number
  tier_id: number
  amount: number
  currency: string
  status: PaymentStatus
  payment_method: string
  reference: string
  paystack_reference?: string
  metadata: Record<string, any>
  processed_at?: string
  created_at: string
  updated_at: string
}

export interface TierUpgrade {
  id: number
  user_id: number
  from_tier_id?: number
  to_tier_id: number
  payment_id?: number
  status: "pending" | "approved" | "rejected" | "completed"
  upgrade_pending: boolean
  admin_notes?: string
  approved_by?: number
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface SystemConfig {
  id: number
  key: string
  value: any
  description?: string
  created_at: string
  updated_at: string
}

export interface Album {
  id: number
  title: string
  slug: string
  description?: string
  cover_url: string
  cover_blur_hash?: string
  type: AlbumType
  genre?: string
  release_date: string
  total_tracks: number
  duration_seconds: number
  is_premium: boolean
  required_tier: UserTier
  coin_price: number
  play_count: number
  like_count: number
  download_count: number
  is_featured: boolean
  is_published: boolean
  producer?: string
  record_label?: string
  copyright_info?: string
  explicit_content: boolean
  tags: string[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Track {
  id: number
  album_id?: number
  title: string
  slug: string
  artist: string
  featuring?: string
  duration_seconds: number
  track_number?: number
  disc_number: number
  lyrics?: string
  cover_url?: string
  cover_blur_hash?: string
  audio_url?: string
  audio_preview_url?: string
  waveform_data?: Record<string, any>
  is_premium: boolean
  required_tier: UserTier
  coin_price: number
  play_count: number
  like_count: number
  download_count: number
  share_count: number
  release_date: string
  is_single: boolean
  is_featured: boolean
  is_published: boolean
  genre?: string
  mood?: string
  tempo?: number
  key_signature?: string
  producer?: string
  songwriter?: string
  explicit_content: boolean
  isrc?: string
  tags: string[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface StreamingLink {
  id: number
  track_id?: number
  album_id?: number
  platform: string
  url: string
  platform_id?: string
  is_verified: boolean
  created_at: string
}

export interface MusicVideo {
  id: number
  track_id?: number
  title: string
  slug: string
  description?: string
  video_url: string
  thumbnail_url: string
  thumbnail_blur_hash?: string
  duration_seconds: number
  views: number
  likes: number
  dislikes: number
  comments_count: number
  is_premium: boolean
  required_tier: UserTier
  coin_price: number
  release_date: string
  is_featured: boolean
  is_published: boolean
  director?: string
  producer?: string
  location?: string
  explicit_content: boolean
  quality: string
  tags: string[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface GalleryItem {
  id: number
  title: string
  slug: string
  description?: string
  image_url: string
  thumbnail_url?: string
  blur_hash?: string
  category: string
  subcategory?: string
  is_premium: boolean
  required_tier: UserTier
  coin_price: number
  views: number
  likes: number
  downloads: number
  is_featured: boolean
  is_published: boolean
  photographer?: string
  location?: string
  taken_at?: string
  camera_info: Record<string, any>
  tags: string[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CoinTransaction {
  id: number
  user_id: number
  amount: number
  transaction_type: TransactionType
  payment_method?: PaymentMethod
  reference_id?: string
  external_reference?: string
  status: PaymentStatus
  description?: string
  metadata: Record<string, any>
  fee_amount: number
  net_amount?: number
  currency: string
  exchange_rate: number
  processed_at?: string
  failed_at?: string
  failure_reason?: string
  refunded_at?: string
  refund_reason?: string
  created_at: string
  updated_at: string
}

export interface ContentAccess {
  id: number
  user_id: number
  content_type: string
  content_id: number
  access_type: string
  coins_spent: number
  expires_at?: string
  access_count: number
  last_accessed?: string
  is_active: boolean
  metadata: Record<string, any>
  created_at: string
}

export interface Post {
  id: number
  user_id: number
  content: string
  type: PostType
  media_urls: string[]
  media_types: string[]
  thumbnail_urls: string[]
  like_count: number
  comment_count: number
  share_count: number
  view_count: number
  is_featured: boolean
  is_pinned: boolean
  is_published: boolean
  is_deleted: boolean
  deleted_at?: string
  scheduled_at?: string
  expires_at?: string
  location?: string
  mood?: string
  tags: string[]
  mentions: number[]
  hashtags: string[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Comment {
  id: number
  post_id: number
  user_id: number
  parent_id?: number
  content: string
  like_count: number
  reply_count: number
  is_edited: boolean
  is_deleted: boolean
  deleted_at?: string
  mentions: number[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Event {
  id: number
  title: string
  slug: string
  description?: string
  short_description?: string
  venue: string
  address: string
  city: string
  state: string
  country: string
  coordinates?: string
  date: string
  end_date?: string
  doors_open?: string
  ticket_price: number
  vip_price?: number
  max_tickets: number
  max_vip_tickets: number
  tickets_sold: number
  vip_tickets_sold: number
  image_url?: string
  banner_url?: string
  gallery_urls: string[]
  is_active: boolean
  is_featured: boolean
  is_sold_out: boolean
  is_canceled: boolean
  canceled_reason?: string
  age_restriction?: number
  dress_code?: string
  special_instructions?: string
  organizer: string
  contact_email?: string
  contact_phone?: string
  social_links: Record<string, any>
  tags: string[]
  category?: string
  genre?: string
  seo_title?: string
  seo_description?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: number
  user_id: number
  event_id: number
  ticket_number: string
  ticket_type: string
  qr_code: string
  qr_code_url?: string
  status: TicketStatus
  payment_reference: string
  amount_paid: number
  fees_paid: number
  total_paid: number
  currency: string
  payment_method?: PaymentMethod
  buyer_name: string
  buyer_email: string
  buyer_phone?: string
  seat_number?: string
  section?: string
  row_number?: string
  special_access: string[]
  purchased_at: string
  used_at?: string
  validated_by?: number
  validation_location?: string
  transfer_count: number
  max_transfers: number
  is_transferable: boolean
  notes?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description?: string
  short_description?: string
  price: number
  compare_at_price?: number
  cost_price?: number
  images: string[]
  thumbnail_url?: string
  sizes: string[]
  colors: string[]
  category?: string
  subcategory?: string
  brand: string
  sku?: string
  barcode?: string
  is_premium_only: boolean
  required_tier: UserTier
  coin_price: number
  stock_quantity: number
  low_stock_threshold: number
  weight?: number
  dimensions: Record<string, any>
  is_active: boolean
  is_featured: boolean
  is_digital: boolean
  requires_shipping: boolean
  tax_rate: number
  tags: string[]
  seo_title?: string
  seo_description?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  user_id: number
  order_number: string
  status: string
  payment_status: PaymentStatus
  payment_method?: PaymentMethod
  payment_reference?: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  coins_used: number
  shipping_address: Record<string, any>
  billing_address?: Record<string, any>
  notes?: string
  tracking_number?: string
  shipped_at?: string
  delivered_at?: string
  canceled_at?: string
  cancellation_reason?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Notification {
  id: number
  user_id: number
  type: NotificationType
  title: string
  message: string
  data: Record<string, any>
  is_read: boolean
  is_sent: boolean
  sent_at?: string
  expires_at?: string
  created_at: string
}

export interface UserSettings {
  id: number
  user_id: number
  theme: string
  language: string
  timezone: string
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  marketing_emails: boolean
  privacy_level: string
  auto_play_videos: boolean
  show_online_status: boolean
  allow_friend_requests: boolean
  content_filter_level: string
  created_at: string
  updated_at: string
}

// New Community Types (from previous, ensure CommunityPost.content is string for HTML)
export interface CommunityCategory {
  id: number
  name: string
  slug: string
  description?: string
  created_at: string
}

export interface CommunityPost {
  id: number
  user_id: number // References public.users.id (BIGINT)
  category_id: number
  content: string // HTML content from rich text editor
  media_url?: string
  media_type?: "image" | "audio" | "video"
  media_metadata?: Record<string, any>
  vote_count: number
  comment_count: number
  tags?: string[]
  mentions?: { user_id: string; username: string; position: number }[] // Or a simpler structure if not using position
  is_published: boolean
  is_edited: boolean
  is_deleted: boolean
  deleted_at?: string
  created_at: string
  updated_at: string
  // Joined data
  user?: Pick<User, "id" | "auth_user_id" | "username" | "full_name" | "avatar_url" | "tier"> // Ensure User has auth_user_id if it's different from id
  category?: Pick<CommunityCategory, "id" | "name" | "slug">
  has_voted?: boolean // Client-side enrichment
  comments?: CommunityComment[] // For eager loading comments if needed
}

export interface CommunityPostVote {
  post_id: number
  user_id: number // References public.users.id (BIGINT)
  created_at: string
}

// NEW Community Comment Types
export interface CommunityComment {
  id: number
  post_id: number
  user_id: number // References public.users.id (BIGINT)
  parent_comment_id?: number | null
  content: string // Can be HTML if comments also use rich text
  like_count: number
  reply_count: number
  is_edited: boolean
  is_deleted: boolean
  deleted_at?: string
  created_at: string
  updated_at: string
  // Joined data
  user?: Pick<User, "id" | "auth_user_id" | "username" | "full_name" | "avatar_url" | "tier">
  replies?: CommunityComment[] // For nested replies
  has_liked?: boolean // Client-side enrichment
}

export interface CommunityCommentLike {
  comment_id: number
  user_id: number // References public.users.id (BIGINT)
  created_at: string
}

// NEW Community Report Types
export type ReportReason = "spam" | "harassment" | "hate_speech" | "misinformation" | "inappropriate_content" | "other"
export type ReportTargetType = "post" | "comment"

export interface CommunityReport {
  id: number
  reporter_user_id: number // References public.users.id (BIGINT)
  target_id: number // Post or Comment ID
  target_type: ReportTargetType
  reason: ReportReason
  additional_notes?: string
  is_resolved: boolean
  resolved_by?: string // UUID of admin/mod
  resolved_at?: string
  created_at: string
}

// Update Database interface
export interface Database {
  public: {
    Tables: {
      // ... (all existing tables: users, albums, tracks, etc.)
      users: {
        Row: User
        Insert: Partial<User>
        Update: Partial<User>
      }
      tiers: {
        Row: Tier
        Insert: Omit<Tier, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Tier, "id" | "created_at" | "updated_at">>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Payment, "id" | "created_at" | "updated_at">>
      }
      tier_upgrades: {
        Row: TierUpgrade
        Insert: Omit<TierUpgrade, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<TierUpgrade, "id" | "created_at" | "updated_at">>
      }
      system_config: {
        Row: SystemConfig
        Insert: Omit<SystemConfig, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<SystemConfig, "id" | "created_at" | "updated_at">>
      }
      albums: {
        Row: Album
        Insert: Omit<Album, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Album, "id" | "created_at" | "updated_at">>
      }
      tracks: {
        Row: Track
        Insert: Omit<Track, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Track, "id" | "created_at" | "updated_at">>
      }
      streaming_links: {
        Row: StreamingLink
        Insert: Omit<StreamingLink, "id" | "created_at">
        Update: Partial<Omit<StreamingLink, "id" | "created_at">>
      }
      music_videos: {
        Row: MusicVideo
        Insert: Omit<MusicVideo, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<MusicVideo, "id" | "created_at" | "updated_at">>
      }
      gallery_items: {
        Row: GalleryItem
        Insert: Omit<GalleryItem, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<GalleryItem, "id" | "created_at" | "updated_at">>
      }
      coin_transactions: {
        Row: CoinTransaction
        Insert: Omit<CoinTransaction, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<CoinTransaction, "id" | "created_at" | "updated_at">>
      }
      content_access: {
        Row: ContentAccess
        Insert: Omit<ContentAccess, "id" | "created_at">
        Update: Partial<Omit<ContentAccess, "id" | "created_at">>
      }
      posts: {
        Row: Post
        Insert: Omit<Post, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Post, "id" | "created_at" | "updated_at">>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Comment, "id" | "created_at" | "updated_at">>
      }
      events: {
        Row: Event
        Insert: Omit<Event, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Event, "id" | "created_at" | "updated_at">>
      }
      tickets: {
        Row: Ticket
        Insert: Omit<Ticket, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Ticket, "id" | "created_at" | "updated_at">>
      }
      products: {
        Row: Product
        Insert: Omit<Product, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Product, "id" | "created_at" | "updated_at">>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Order, "id" | "created_at" | "updated_at">>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, "id" | "created_at">
        Update: Partial<Omit<Notification, "id" | "created_at">>
      }
      user_settings: {
        Row: UserSettings
        Insert: Omit<UserSettings, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<UserSettings, "id" | "created_at" | "updated_at">>
      }
      community_categories: {
        Row: CommunityCategory
        Insert: Omit<CommunityCategory, "id" | "created_at">
        Update: Partial<Omit<CommunityCategory, "id" | "created_at">>
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
        > & { user_id: number } // Ensure user_id is always provided on insert
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
      // ... (other tables like albums, tracks, etc.)
    }
    Functions: {
      handle_post_vote: {
        Args: {
          p_post_id: number
          p_voter_id: string
          p_post_creator_id: string
          p_coin_amount: number
        }
        Returns: boolean
      }
      handle_tier_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      // Add other functions if you call them via RPC
    }
    Enums: {
      // Add enums if not automatically inferred by Supabase client
      report_reason: ReportReason
      report_target_type: ReportTargetType
    }
  }
}
