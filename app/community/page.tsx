"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Heart, Share2, Plus, TrendingUp, Crown, Send, MoreHorizontal } from 'lucide-react'
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { CompleteWorkingCommunityClient } from "./complete-working/complete-working-client"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

interface Post {
  id: string
  content: string
  created_at: string
  updated_at: string
  author_id: string
  likes_count: number
  comments_count: number
  user_profiles: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    tier: string
    coins: number
    reputation_score: number
  }
  community_categories: {
    id: string
    name: string
    slug: string
    icon: string
    color: string
  }
  user_has_liked: boolean
}

interface Comment {
  id: string
  content: string
  created_at: string
  author_id: string
  post_id: string
  author: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    tier: string
  }
}

async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .single()

  if (profileError) {
    console.error("Profile error:", profileError)
    // Profile might not exist yet, let the client handle it
    return { user, profile: null }
  }

  return { user, profile: { ...profile, email: user.email } }
}

async function getCommunityData() {
  const supabase = await createClient()

  // Get categories
  const { data: categories } = await supabase
    .from("community_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order")

  // Get initial posts with user data and vote status
  const { data: posts } = await supabase
    .from("community_posts")
    .select(`
      *,
      user_profiles!inner (
        id, username, full_name, avatar_url, tier, coins, reputation_score
      ),
      community_categories!inner (
        id, name, slug, icon, color
      )
    `)
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(20)

  return {
    categories: categories || [],
    posts: posts || [],
  }
}

export default async function CommunityPage() {
  const { user, profile } = await getCurrentUser()
  const { categories, posts } = await getCommunityData()

  return (
    <AuthGuard>
      <CompleteWorkingCommunityClient 
        user={user} 
        profile={profile} 
        initialPosts={posts} 
        categories={categories} 
      />
    </AuthGuard>
  )
}
