export type UserTier = "grassroot" | "pioneer" | "elder" | "blood"
export type FreebieStatus = "pending" | "approved" | "shipped" | "delivered" | "rejected"

export interface FreebieItem {
  id: number
  name: string
  slug: string
  description?: string
  short_description?: string
  images: string[]
  thumbnail_url?: string
  category: string
  subcategory?: string
  brand: string
  required_tier: UserTier
  stock_quantity: number
  max_per_user: number
  claim_count: number
  total_claims: number
  is_active: boolean
  is_featured: boolean
  requires_shipping: boolean
  weight?: number
  dimensions: Record<string, any>
  tags: string[]
  expires_at?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface FreebieClaim {
  id: number
  user_id: number
  freebie_id: number
  status: FreebieStatus
  shipping_address: {
    fullName: string
    address: string
    city: string
    state: string
    postalCode: string
    phone: string
  }
  tracking_number?: string
  notes?: string
  claimed_at: string
  processed_at?: string
  shipped_at?: string
  delivered_at?: string
  created_at: string
  updated_at: string
  // Joined data
  freebie?: FreebieItem
  user?: {
    id: number
    username: string
    full_name: string
    email: string
    tier: UserTier
  }
}

export interface FreebieFormData {
  name: string
  description: string
  category: string
  required_tier: UserTier
  stock_quantity: number
  max_per_user: number
  is_active: boolean
  is_featured: boolean
  requires_shipping: boolean
  expires_at: string
  images: string[]
}
