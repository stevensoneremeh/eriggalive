import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export function createServerClient() {
  const cookieStore = cookies()

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      storage: {
        getItem: (key: string) => {
          return cookieStore.get(key)?.value
        },
        setItem: (key: string, value: string) => {
          cookieStore.set({ name: key, value })
        },
        removeItem: (key: string) => {
          cookieStore.set({ name: key, value: "", expires: new Date(0) })
        },
      },
    },
  })
}

// For server actions and API routes
export function createServiceRoleClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
