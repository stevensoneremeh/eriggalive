
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page")

    if (page) {
      // Get content for specific page
      const { data, error } = await supabase
        .from("page_content")
        .select("*")
        .eq("page_name", page)
        .order("section_order", { ascending: true })

      if (error) throw error
      return NextResponse.json({ content: data || [] })
    } else {
      // Get all pages overview
      const { data, error } = await supabase
        .from("page_content")
        .select("page_name, page_title, is_active")
        .order("page_name", { ascending: true })

      if (error) throw error
      
      // Get unique pages
      const pages = data?.reduce((acc: any[], item) => {
        if (!acc.find(p => p.page_name === item.page_name)) {
          acc.push(item)
        }
        return acc
      }, [])

      return NextResponse.json({ pages: pages || [] })
    }
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
      .from("page_content")
      .insert([body])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ content: data }, { status: 201 })
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
      .from("page_content")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ content: data })
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
      .from("page_content")
      .delete()
      .eq("id", id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
