import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("vault_items")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ items: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { data, error } = await supabase
      .from("vault_items")
      .insert([{ ...body, created_by: user.id }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ item: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    const { data, error } = await supabase
      .from("vault_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ item: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    const { error } = await supabase
      .from("vault_items")
      .delete()
      .eq("id", id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
