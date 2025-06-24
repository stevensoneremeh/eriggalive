"use server"

import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server"
import type { User as PublicUser } from "@/types/database"

/**
 * Get or create a user profile for the authenticated user
 * This function will automatically sync auth users with the public users table
 */
export async function getOrCreateUserProfile(): Promise<PublicUser> {
  try {
    const supabase = createServerSupabaseClient()

    // Get the authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      throw new Error("User not authenticated")
    }

    // Try to get existing user profile
    const { data: existingProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .single()

    // If profile exists, return it
    if (existingProfile && !profileError) {
      return existingProfile
    }

    // If profile doesn't exist, use the database function to create it
    const adminSupabase = createAdminSupabaseClient()

    const { data: newProfile, error: createError } = await adminSupabase.rpc("get_or_create_user_profile", {
      user_auth_id: authUser.id,
    })

    if (createError) {
      console.error("Failed to create user profile:", createError)
      throw new Error(`Failed to create user profile: ${createError.message}`)
    }

    if (!newProfile) {
      throw new Error("Failed to create user profile: No data returned")
    }

    return newProfile
  } catch (error) {
    console.error("Error in getOrCreateUserProfile:", error)
    throw error
  }
}

/**
 * Sync all auth users with the public users table
 * This is an admin function to fix any sync issues
 */
export async function syncAllAuthUsers() {
  try {
    const adminSupabase = createAdminSupabaseClient()

    // Get all auth users
    const { data: authUsers, error: authError } = await adminSupabase.auth.admin.listUsers()

    if (authError) {
      throw new Error(`Failed to get auth users: ${authError.message}`)
    }

    let syncCount = 0
    const errors: string[] = []

    for (const authUser of authUsers.users) {
      try {
        await adminSupabase.rpc("get_or_create_user_profile", {
          user_auth_id: authUser.id,
        })
        syncCount++
      } catch (error: any) {
        errors.push(`Failed to sync user ${authUser.email}: ${error.message}`)
      }
    }

    return {
      success: true,
      syncCount,
      totalUsers: authUsers.users.length,
      errors,
    }
  } catch (error: any) {
    console.error("Error syncing auth users:", error)
    return {
      success: false,
      error: error.message,
      syncCount: 0,
      totalUsers: 0,
      errors: [],
    }
  }
}
