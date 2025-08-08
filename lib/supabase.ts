import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton pattern to prevent multiple instances
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    })

    // Add global error handling for client-side
    if (typeof window !== 'undefined') {
      supabaseInstance.auth.onAuthStateChange((event, session) => {
        console.log('Auth State Change:', event, session)
        
        if (event === 'SIGNED_OUT') {
          // Clear any cached tokens or user data
          localStorage.clear()
          sessionStorage.clear()
        }
      })
    }
  }
  return supabaseInstance
}

// Export a default client for immediate use
export const supabase = getSupabaseClient()

// Enhanced signup function
export async function signup(email: string, password: string, metadata: Record<string, any> = {}) {
  const supabaseClient = getSupabaseClient()
  
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })

    if (error) throw error
    
    return data
  } catch (error: any) {
    console.error('Signup Error:', error)
    
    // Detailed error handling
    switch (error.message) {
      case 'User already exists':
        return { error: 'An account with this email already exists.' }
      case 'Rate limit exceeded':
        return { error: 'Too many signup attempts. Please try again later.' }
      default:
        return { error: error.message || 'Signup failed. Please try again.' }
    }
  }
}

// Optional: Add a server-side friendly client creator
export function createServerComponentClient() {
  // This is a placeholder - you might want to use Supabase's recommended 
  // server-side client creation method for Next.js
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}
