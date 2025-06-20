"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface FollowButtonProps {
  userId: number
  username: string
  isFollowing?: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

// Simple follow button that doesn't break existing functionality
export function FollowButton({ userId, username, isFollowing = false, onFollowChange }: FollowButtonProps) {
  const [following, setFollowing] = useState(isFollowing)
  const [loading, setLoading] = useState(false)
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const handleFollow = async () => {
    if (!user || !profile) {
      toast({
        title: "Login Required",
        description: "Please login to follow users.",
        variant: "destructive",
      })
      return
    }

    if (profile.id === userId) {
      toast({
        title: "Cannot Follow",
        description: "You cannot follow yourself.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newFollowingState = !following
      setFollowing(newFollowingState)
      onFollowChange?.(newFollowingState)

      toast({
        title: newFollowingState ? "Following!" : "Unfollowed",
        description: newFollowingState ? `You are now following @${username}` : `You unfollowed @${username}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user || profile?.id === userId) return null

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={handleFollow}
      disabled={loading}
      className={cn(
        "flex items-center gap-2",
        following && "hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20",
      )}
    >
      {following ? (
        <>
          <UserCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Following</span>
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Follow</span>
        </>
      )}
    </Button>
  )
}
