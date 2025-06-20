"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserTierBadge } from "@/components/user-tier-badge"
import { TrendingUp, Users, Trophy, Star, Coins, MessageCircle } from "lucide-react"

interface CommunitySidebarProps {
  categories: any[]
  profile: any
}

export function CommunitySidebar({ categories, profile }: CommunitySidebarProps) {
  const getTierColor = (tier: string) => {
    const colors = {
      admin: "bg-red-500",
      blood_brotherhood: "bg-red-600",
      elder: "bg-purple-500",
      pioneer: "bg-blue-500",
      grassroot: "bg-green-500",
    }
    return colors[tier as keyof typeof colors] || "bg-gray-500"
  }

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardHeader className="text-center pb-4">
          <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-blue-100 dark:ring-blue-900">
            <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-2xl">
              {profile?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-lg">{profile?.full_name}</h3>
            <p className="text-gray-500 text-sm">@{profile?.username}</p>
            <div className="mt-2">
              <UserTierBadge tier={profile?.tier} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                <Coins className="h-4 w-4" />
                <span className="font-bold">{profile?.coins?.toLocaleString() || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Coins</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                <MessageCircle className="h-4 w-4" />
                <span className="font-bold">{profile?.posts_count || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Posts</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="font-bold">{profile?.followers_count || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Followers</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                <Star className="h-4 w-4" />
                <span className="font-bold">{profile?.reputation_score || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Reputation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.map((category) => (
            <Button key={category.id} variant="ghost" className="w-full justify-start h-auto p-3">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{category.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-gray-500">{category.description}</div>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {category.post_count || 0}
                </Badge>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Community Stats */}
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5" />
            Community Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {categories.reduce((sum, cat) => sum + (cat.post_count || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Total Posts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">1,234</div>
            <div className="text-sm text-gray-500">Active Members</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">{categories.length}</div>
            <div className="text-sm text-gray-500">Categories</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
