import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"


export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient() // Changed from createRouteHandlerClient

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: products, error } = await supabase
      .from("merch")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Products API] Error fetching products:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products: products || [] })
  } catch (error: any) {
    console.error("[Products API] Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient() // Changed from createRouteHandlerClient

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, price, stock, image_url, category } = body

    if (!name || !price) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 })
    }

    const { data: product, error } = await supabase
      .from("merch")
      .insert([
        {
          name,
          description: description || null,
          price: parseFloat(price),
          stock: parseInt(stock) || 0,
          image_url: image_url || null,
          category: category || null,
          is_active: true,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[Products API] Error creating product:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error: any) {
    console.error("[Products API] Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}