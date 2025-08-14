"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    userData: { 
      username: string; 
      full_name: string; 
      tier?: string; 
      payment_reference?: string 
    }
  ) => Promise<{ error: any; user?: User | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create a single supabase client instance
let supabaseClient: ReturnType<typeof createClient> | null = null

const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("auth_user_id", userId)
          .single()

        if (error) {
          console.error("Error fetching profile:", error)
          return null
        }

        return data
      } catch (error) {
        console.error("Error in fetchProfile:", error)
        return null
      }
    },
    [supabase]
  )

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      userData: { 
        username: string; 
        full_name: string; 
        tier?: string; 
        payment_reference?: string 
      }
    ) => {
      try {
        setLoading(true)
        
        // Check if username already exists
        const { data: existingUser, error: usernameCheckError } = await supabase
          .from('users')
          .select('username')
          .eq('username', userData.username)
          .single()

        if (existingUser) {
          return { 
            error: { 
              message: 'Username is already taken', 
              code: 'USERNAME_TAKEN' 
            } 
          }
        }

        // Signup with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: userData.username,
              full_name: userData.full_name
            }
          }
        })

        if (authError) {
          setLoading(false)
          return { error: authError }
        }

        // If user is created, insert profile data
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              auth_user_id: authData.user.id,
              email: email,
              username: userData.username,
              full_name: userData.full_name,
              tier: userData.tier || 'free',
              payment_reference: userData.payment_reference
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
            
            // Optional: Delete auth user if profile creation fails
            await supabase.auth.admin.deleteUser(authData.user.id)
            
            setLoading(false)
            return { 
              error: {
                message: 'Failed to create user profile',
                details: profileError
              }
            }
          }
        }

        // Redirect based on confirmation status
        if (authData.user && !authData.user.email_confirmed_at) {
          router.push("/signup/success")
        } else if (authData.user) {
          router.push("/dashboard")
        }

        setLoading(false)
        return { 
          error: null, 
          user: authData.user 
        }
      } catch (error) {
        console.error('Signup Error:', error)
        setLoading(false)
        return { 
          error: {
            message: 'An unexpected error occurred during signup',
            details: error
          } 
        }
      }
    },
    [supabase.auth, router]
  )

  // ... [rest of the code remains the same as in your original file]

  return <AuthContext.Provider value={/* ... existing value ... */}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
