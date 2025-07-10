import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Sample products used as fallback when database table doesn't exist yet
const SAMPLE_PRODUCTS = [
  {
    id: "1",
    name: "Paper Boi Hoodie",
    description: "Premium quality hoodie with Erigga's signature Paper Boi design",
    price: 15000,
    coin_price: 1500,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "clothing",
    is_premium_only: false,
    required_tier: null,
    stock_quantity: 25,
    rating: 4.8,
    review_count: 124,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Warri Vibe T-Shirt",
    description: "Comfortable cotton t-shirt representing Warri culture",
    price: 8000,
    coin_price: 800,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["S", "M", "L", "XL"],
    category: "clothing",
    is_premium_only: false,
    required_tier: null,
    stock_quantity: 50,
    rating: 4.6,
    review_count: 89,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Erigga Signature Cap",
    description: "Adjustable cap with embroidered Erigga logo",
    price: 5000,
    coin_price: 500,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["One Size"],
    category: "accessories",
    is_premium_only: false,
    required_tier: null,
    stock_quantity: 75,
    rating: 4.7,
    review_count: 156,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Limited Edition Vinyl Record",
    description: "Exclusive vinyl record of 'The Erigma' album – Blood tier exclusive",
    price: 25000,
    coin_price: 2500,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["Standard"],
    category: "collectibles",
    is_premium_only: true,
    required_tier: "blood",
    stock_quantity: 10,
    rating: 5.0,
    review_count: 23,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Street Chronicles Poster Set",
    description: "Set of 3 high-quality posters from different eras",
    price: 3000,
    coin_price: 300,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["A2"],
    category: "collectibles",
    is_premium_only: false,
    required_tier: null,
    stock_quantity: 100,
    rating: 4.5,
    review_count: 67,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Erigga Phone Case",
    description: "Protective phone case with custom Erigga artwork",
    price: 4500,
    coin_price: 450,
    images: ["/placeholder.svg?height=400&width=400"],
    sizes: ["iPhone 14", "iPhone 15", "Samsung S23", "Samsung S24"],
    category: "accessories",
    is_premium_only: false,
    required_tier: null,
    stock_quantity: 40,
    rating: 4.4,
    review_count: 78,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      // Handle case where products table doesn't exist yet
      if (error.code === "42P01" || error.message.includes("relation") || error.message.includes("products")) {
        console.log("Products table not found, returning sample data")
        return NextResponse.json(SAMPLE_PRODUCTS)
      }

      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    // Return database products or fallback to samples if empty
    return NextResponse.json(products && products.length > 0 ? products : SAMPLE_PRODUCTS)
  } catch (err: any) {
    console.error("API error:", err)
    // Return sample data on any error to ensure the merch page always works
    return NextResponse.json(SAMPLE_PRODUCTS)
  }
}
