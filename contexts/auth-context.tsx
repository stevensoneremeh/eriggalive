"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface UserProfile {
  id: string
  auth_user_id: string
  username: string
  full_name?: string
  email: string
  avatar_url?: string
  tier: string
  coins_balance: number
  level: number
  points: number
  reputation_score: number
  role: string
  is_active: boolean
  is_verified: boolean
  is_banned: boolean
  last_seen: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signUp: (
    email: string,
    password: string,
    metadata?: { username?: string; full_name?: string; tier?: string },
  ) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
  uploadAvatar: (file: File) => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("Getting initial session...")
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setLoading(false)
          return
        }

        console.log("Initial session:", session?.user?.id || "No session")
        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id || "No user")

      if (session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for:", userId)
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

      if (error) {
        console.error("Error fetching profile:", error)
        // If profile doesn't exist, create one
        if (error.code === "PGRST116") {
          await createUserProfile(userId)
        }
        return
      }

      console.log("User profile fetched:", data?.username)
      if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
    }
  }

  const createUserProfile = async (userId: string) => {
    try {
      console.log("Creating user profile for:", userId)
      const { data: authUser } = await supabase.auth.getUser()

      if (!authUser.user) return

      const profileData = {
        auth_user_id: userId,
        username: authUser.user.user_metadata?.username || authUser.user.email?.split("@")[0] || "user",
        full_name: authUser.user.user_metadata?.full_name || "",
        email: authUser.user.email || "",
        tier: authUser.user.user_metadata?.tier || "grassroot",
        coins_balance: 100, // Welcome bonus
        level: 1,
        points: 0,
        reputation_score: 0,
        role: "user",
        is_active: true,
        is_verified: false,
        is_banned: false,
        last_seen: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("users").insert(profileData).select().single()

      if (error) {
        console.error("Error creating profile:", error)
        return
      }

      console.log("User profile created:", data?.username)
      if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error("Error in createUserProfile:", error)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log("Signing in user:", email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        toast.error(error.message || "Failed to sign in")
        return { error }
      }

      if (data.user) {
        console.log("Sign in successful")
        toast.success("Welcome back!")
      }

      return { error: null }
    } catch (error) {
      console.error("Sign in error:", error)
      toast.error("An unexpected error occurred")
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    metadata?: { username?: string; full_name?: string; tier?: string },
  ) => {
    setLoading(true)
    try {
      console.log("Signing up user:", email, metadata)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: metadata?.username || "",
            full_name: metadata?.full_name || "",
            tier: metadata?.tier || "grassroot",
          },
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        toast.error(error.message || "Failed to create account")
        return { error }
      }

      console.log("Sign up successful")
      toast.success("Account created successfully!")
      return { error: null }
    } catch (error) {
      console.error("Sign up error:", error)
      toast.error("An unexpected error occurred")
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      console.log("Signing out user")
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      console.log("Sign out successful")
      toast.success("Signed out successfully")
    } catch (error) {
      console.error("Sign out error:", error)
      toast.error("Failed to sign out")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log("Resetting password for:", email)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      console.log("Password reset email sent")
      toast.success("Password reset email sent!")
    } catch (error: any) {
      console.error("Reset password error:", error)
      toast.error(error.message || "Failed to send reset email")
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return

    try {
      console.log("Updating profile:", updates)
      const { error } = await supabase.from("users").update(updates).eq("auth_user_id", user.id)

      if (error) throw error

      setProfile({ ...profile, ...updates })
      console.log("Profile updated successfully")
      toast.success("Profile updated successfully!")
    } catch (error: any) {
      console.error("Update profile error:", error)
      toast.error(error.message || "Failed to update profile")
      throw error
    }
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null

    try {
      console.log("Uploading avatar:", file.name)

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split("/").pop()
        if (oldPath && !oldPath.includes("placeholder")) {
          await supabase.storage.from("avatars").remove([`${user.id}/${oldPath}`])
        }
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

      if (uploadError) {
        console.error("Upload error:", uploadError)
        toast.error("Failed to upload avatar")
        return null
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl })

      console.log("Avatar uploaded successfully")
      toast.success("Avatar updated successfully!")
      return publicUrl
    } catch (error: any) {
      console.error("Upload avatar error:", error)
      toast.error("Failed to upload avatar")
      return null
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    console.log("Refreshing profile")
    await fetchUserProfile(user.id)
  }

  const value: AuthContextType = {
    user,
    profile,
    isAuthenticated: !!user,
    isLoading: loading,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    uploadAvatar,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
