"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Star, Crown, Zap, Flame } from "lucide-react"

const TIER_ICONS = {
  grassroot: Star,
  pioneer: Zap,
  elder: Crown,
  blood_brotherhood: Flame,
}

const TIER_COLORS = {
  grassroot: "text-green-500",
  pioneer: "text-blue-500",
  elder: "text-purple-500",
  blood_brotherhood: "text-red-500",
}

export function CreateFreebiesPost() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const { user, profile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create a post",
        variant: "destructive",
      })
      return
    }

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content for your post",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const postData = {
        title: title.trim(),
        content: content.trim(),
        user_id: profile.id,
        upvotes: 0,
        downvotes: 0,
      }

      const { data, error } = await supabase
        .from("freebies_posts")
        .insert(postData)
        .select()
        .single()

      if (error) throw error

      // Reset form
      setTitle("")
      setContent("")
      setIsExpanded(false)

      toast({
        title: "Post created!",
        description: "Your post has been shared in the freebies room",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTierIcon = (tier: string) => {
    const Icon = TIER_ICONS[tier as keyof typeof TIER_ICONS] || Star
    return Icon
  }

  const getTierColor = (tier: string) => {
    return TIER_COLORS[tier as keyof typeof TIER_COLORS] || "text-gray-500"
  }

  if (!profile) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4 flex items-center justify-center">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Share in Freeb\
