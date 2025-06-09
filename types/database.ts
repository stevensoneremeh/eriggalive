export type UserTier = "street_rep" | "warri_elite" | "erigma_circle"
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "incomplete"
export type TicketStatus = "confirmed" | "pending" | "canceled"
export type ContentType = "video" | "audio" | "image"
export type PostType = "bars" | "story" | "event" | "general"
export type AlbumType = "album" | "ep" | "mixtape" | "single"

export interface User {
  id: number
  auth_user_id: string
  username: string
  full_name: string
  avatar_url?: string
  tier: UserTier
  level: number
  points: number
  erigga_id?: string
  bio?: string
  location?: string
  created_at: string
  updated_at: string
}

export interface Album {
  id: number
  title: string
  description?: string
  cover_url: string
  type: AlbumType
  release_date: string
  total_tracks: number
  duration?: string
  is_premium: boolean
  required_tier: UserTier
  play_count: number
  like_count: number
  created_at: string
  updated_at: string
}

export interface Track {
  id: number
  album_id?: number
  title: string
  artist: string
  featuring?: string
  duration: string
  track_number?: number
  lyrics?: string
  cover_url?: string
  audio_url?: string
  is_premium: boolean
  required_tier: UserTier
  play_count: number
  like_count: number
  release_date: string
  created_at: string
  updated_at: string
}

export interface StreamingLink {
  id: number
  track_id?: number
  album_id?: number
  platform: string
  url: string
  created_at: string
}

export interface MusicVideo {
  id: number
  track_id?: number
  title: string
  description?: string
  video_url: string
  thumbnail_url: string
  duration: string
  views: number
  is_premium: boolean
  required_tier: UserTier
  release_date: string
  created_at: string
}

export interface GalleryItem {
  id: number
  title: string
  description?: string
  image_url: string
  category: string
  is_premium: boolean
  required_tier: UserTier
  created_at: string
}

export interface Event {
  id: number
  title: string
  description?: string
  venue: string
  location: string
  date: string
  ticket_price: number
  max_tickets: number
  tickets_sold: number
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: number
  user_id: number
  event_id: number
  ticket_number: string
  qr_code: string
  status: TicketStatus
  payment_reference: string
  amount_paid: number
  purchased_at: string
  used_at?: string
  created_at: string
  event?: Event
}

export interface MediaContent {
  id: number
  title: string
  description?: string
  type: ContentType
  file_url: string
  thumbnail_url?: string
  duration?: number
  is_premium: boolean
  required_tier: UserTier
  view_count: number
  like_count: number
  created_at: string
  updated_at: string
}

export interface Post {
  id: number
  user_id: number
  content: string
  type: PostType
  media_url?: string
  like_count: number
  comment_count: number
  is_featured: boolean
  created_at: string
  updated_at: string
  user?: User
}

export interface Comment {
  id: number
  post_id: number
  user_id: number
  content: string
  created_at: string
  updated_at: string
  user?: User
}

export interface PostLike {
  id: number
  post_id: number
  user_id: number
  created_at: string
}

export interface Product {
  id: number
  name: string
  description?: string
  price: number
  images: string[]
  sizes: string[]
  category?: string
  is_premium_only: boolean
  stock_quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CartoonSeries {
  id: number
  title: string
  description?: string
  thumbnail_url?: string
  status: "ongoing" | "completed" | "upcoming"
  category: "comedy" | "drama" | "mystery"
  total_episodes: number
  total_views: number
  rating: number
  release_date: string
  created_at: string
  updated_at: string
}

export interface CartoonEpisode {
  id: number
  series_id: number
  title: string
  description?: string
  episode_number: number
  duration?: string
  video_url?: string
  thumbnail_url?: string
  views: number
  is_released: boolean
  release_date?: string
  created_at: string
  updated_at: string
}

export interface UserEpisodeProgress {
  id: number
  user_id: number
  episode_id: number
  progress_percentage: number
  completed: boolean
  last_watched: string
}
