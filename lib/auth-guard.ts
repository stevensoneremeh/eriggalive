"use server";

import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["users"]["Row"];

/**
 * Ensures the user is authenticated. Redirects to sign-in if not.
 */
export async function requireAuth() {
  const supabase = createServerClient();

  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error getting session:", error);
  }

  if (!session) {
    redirect("/auth/signin");
  }

  return session;
}

/**
 * Returns the authenticated user along with their profile.
 * Creates a default profile if one doesn't exist.
 */
export async function getAuthenticatedUser() {
  const supabase = createServerClient();

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Error getting session:", sessionError);
    return null;
  }

  if (!session) {
    return null;
  }

  // Try to fetch the user's profile
  let { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", session.user.id)
    .single();

  // If no profile exists, create one
  if (profileError && (profileError as any)?.code === "PGRST116") {
    const newProfile: Profile = {
      auth_user_id: session.user.id,
      email: session.user.email!,
      username:
        session.user.user_metadata?.username ||
        session.user.email?.split("@")[0] ||
        "user",
      full_name: session.user.user_metadata?.full_name || null,
      tier: "grassroot",
      role: "user",
      coins: 500,
      level: 1,
      points: 0,
      is_verified: false,
      is_active: true,
      is_banned: false,
      login_count: 1,
      email_verified: !!session.user.email_confirmed_at,
      phone_verified: false,
      two_factor_enabled: false,
      preferences: {},
      metadata: {}
    };

    const { data: createdProfile, error: insertError } = await supabase
      .from("users")
      .insert(newProfile)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating profile:", insertError);
    }

    profile = createdProfile;
  }

  return {
    session,
    user: session.user,
    profile
  };
}
