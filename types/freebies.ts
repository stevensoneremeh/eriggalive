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
  required_tier: "grassroot" | "pioneer" | "elder" | "blood"
  stock_quantity: number
  max_per_user: number
  is_active: boolean
  is_featured: boolean
  requires_shipping: boolean
  weight?: number
  dimensions?: Record<string, any>
  tags: string[]
  claim_count: number
  total_claims: number
  expires_at?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface FreebieClaimRequest {
  id: number
  user_id: number
  freebie_id: number
  status: "pending" | "approved" | "shipped" | "delivered" | "rejected"
  shipping_address: Record<string, any>
  tracking_number?: string
  notes?: string
  claimed_at: string
  processed_at?: string
  shipped_at?: string
  delivered_at?: string
}
