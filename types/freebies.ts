export interface Freebie {
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
  required_tier: "grassroot" | "pioneer" | "elder" | "blood"
  stock_quantity: number
  max_per_user: number
  claim_count: number
  total_claims: number
  is_active: boolean
  is_featured: boolean
  requires_shipping: boolean
  weight?: number
  dimensions?: Record<string, any>
  tags: string[]
  expires_at?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface FreebieClaimRequest {
  freebie_id: number
  shipping_address: {
    full_name: string
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
    phone_number?: string
  }
  notes?: string
}

export interface FreebieClaim {
  id: number
  user_id: string
  freebie_id: number
  status: "pending" | "approved" | "shipped" | "delivered" | "rejected"
  shipping_address: {
    full_name: string
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
    phone_number?: string
  }
  tracking_number?: string
  notes?: string
  claimed_at: string
  processed_at?: string
  shipped_at?: string
  delivered_at?: string
  created_at: string
  updated_at: string
  freebie?: Freebie
}

export interface FreebieFilters {
  category?: string
  required_tier?: "grassroot" | "pioneer" | "elder" | "blood"
  is_featured?: boolean
  search?: string
}

export interface FreebieStats {
  total_freebies: number
  active_freebies: number
  total_claims: number
  pending_claims: number
  shipped_claims: number
  delivered_claims: number
}
