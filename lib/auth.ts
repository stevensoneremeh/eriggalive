import { createClient } from "./supabase/client"
import { createClient as createServerClient } from "./supabase/server"

export async function signUp(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  return { data, error }
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signOut() {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  return { error }
}

export async function getUser() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  return { user, error }
}

export async function getSession() {
  const supabase = await createServerClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  return { session, error }
}
