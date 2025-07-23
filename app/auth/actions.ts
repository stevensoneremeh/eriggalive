"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect("/login?error=Could not authenticate user")
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const username = formData.get("username") as string
  const fullName = formData.get("fullName") as string

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    redirect("/signup?error=Could not create user")
  }

  // Create user profile
  if (authData.user) {
    const { error: profileError } = await supabase.from("users").insert({
      auth_user_id: authData.user.id,
      username,
      full_name: fullName,
      email,
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)
    }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    redirect("/error")
  }

  revalidatePath("/", "layout")
  redirect("/")
}
