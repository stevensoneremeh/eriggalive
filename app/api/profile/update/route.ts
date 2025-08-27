import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export const dynamic = "force-dynamic"

const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal("")),
  date_of_birth: z.string().optional(),
  social_links: z
    .object({
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      youtube: z.string().optional(),
    })
    .optional(),
  is_profile_public: z.boolean().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    if (validatedData.username) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", validatedData.username)
        .neq("id", user.id)
        .single()

      if (existingUser) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 })
      }
    }

    if (validatedData.date_of_birth) {
      const birthDate = new Date(validatedData.date_of_birth)
      const thirteenYearsAgo = new Date()
      thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13)

      if (birthDate > thirteenYearsAgo) {
        return NextResponse.json({ error: "Must be at least 13 years old" }, { status: 400 })
      }
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(validatedData)
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Profile update error:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    await supabase.rpc("log_profile_activity", {
      p_user_id: user.id,
      p_activity_type: "profile_updated",
      p_activity_data: { updated_fields: Object.keys(validatedData) },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 },
      )
    }

    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
