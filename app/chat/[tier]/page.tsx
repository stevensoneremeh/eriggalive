"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { TierChat } from "@/components/tier-chat"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lock, Users, MessageCircle, Crown } from "lucide-react"
import Link from "next/link"

const TIER_INFO = {
  grassroot: {
    name: "Grassroot",
    description: "Connect with fellow grassroot fans",
    color: "bg-green-500",
    icon: Users,
    minTier: "grassroot",
  },
  bronze: {
    name: "Bronze",
    description: "Bronze tier exclusive discussions",
    color: "bg-amber-600",
    icon: MessageCircle,
    minTier: "bronze",
  },
  silver: {
    name: "Silver",
    description: "Silver tier premium conversations",
    color: "bg-gray-400",
    icon: Crown,
    minTier: "silver",
  },
  gold: {
    name: "Gold",
    description: "Gold tier VIP community",
    color: "bg-yellow-500",
    icon: Crown,
    minTier: "gold",
  },
  platinum: {
    name: "Platinum",
    description: "Platinum tier elite discussions",
    color: "bg-purple-500",
    icon: Crown,
    minTier: "platinum",
  },
}

const TIER_HIERARCHY = ["grassroot", "bronze", "silver", "gold", "platinum"]

export default function TierChatPage() {
  const params = useParams()
  const { user, profile, isAuthenticated, isLoading } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)

  const tier = params.tier as string
  const tierInfo = TIER_INFO[tier as keyof typeof TIER_INFO]

  useEffect(() => {
    if (!isLoading && profile && tierInfo) {
      const userTierIndex = TIER_HIERARCHY.indexOf(profile.subscription_tier)
      const requiredTierIndex = TIER_HIERARCHY.indexOf(tierInfo.minTier)
      setHasAccess(userTierIndex >= requiredTierIndex)
    }
  }, [profile, tierInfo, isLoading])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Authentication Required
            </CardTitle>
            <CardDescription>You need to be signed in to access tier chats.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!tierInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Invalid Tier</CardTitle>
            <CardDescription>The requested tier chat does not exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/chat">Browse Available Chats</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasAccess) {
    const Icon = tierInfo.icon

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Access Restricted
            </CardTitle>
            <CardDescription>You need {tierInfo.name} tier or higher to access this chat.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className={`p-2 rounded-full ${tierInfo.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium">{tierInfo.name} Tier</div>
                  <div className="text-sm text-muted-foreground">{tierInfo.description}</div>
                </div>
              </div>
              <div className="text-center">
                <Badge variant="outline">Your tier: {profile?.subscription_tier}</Badge>
              </div>
              <Button asChild className="w-full">
                <Link href="/premium">Upgrade Subscription</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-full ${tierInfo.color}`}>
            <tierInfo.icon className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{tierInfo.name} Chat</h1>
          <Badge variant="secondary">{tierInfo.minTier}</Badge>
        </div>
        <p className="text-muted-foreground">{tierInfo.description}</p>
      </div>

      <TierChat tier={tier} />
    </div>
  )
}
