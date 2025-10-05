import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

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
    const { name, description, price, stock, image_url, category, is_active } = body

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (price !== undefined) updates.price = parseFloat(price)
    if (stock !== undefined) updates.stock = parseInt(stock)
    if (image_url !== undefined) updates.image_url = image_url
    if (category !== undefined) updates.category = category
    if (is_active !== undefined) updates.is_active = is_active

    const { data: product, error } = await supabase
      .from("merch")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("[Products API] Error updating product:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product })
  } catch (error: any) {
    console.error("[Products API] Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

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

    const { error } = await supabase.from("merch").delete().eq("id", params.id)

    if (error) {
      console.error("[Products API] Error deleting product:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Products API] Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}