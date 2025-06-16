"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import {
  Coins,
  Crown,
  Users,
  BookOpen,
  Vault,
  Ticket,
  ShoppingBag,
  TrendingUp,
  Star,
  Calendar,
  Music,
} from "lucide-react"

const getTierColor = (tier: string) => {
  switch (tier) {
    case "admin":
      return "bg-red-500"
    case "blood_brotherhood":
      return "bg-red-600"
    case "elder":
      return "bg-purple-500"
    case "pioneer":
      return "bg-blue-500"
    case "grassroot":
    default:
      return "bg-green-500"
  }
}

const getTierLabel = (tier: string) => {
  switch (tier) {
    case "admin":
      return "Admin"
    case "blood_brotherhood":
      return "Blood Brotherhood"
    case "elder":
      return "Elder"
    case "pioneer":
      return "Pioneer"
    case "grassroot":
    default:
      return "Grassroot"
  }
}

const quickActions = [
  { name: "Community", href: "/community", icon: Users, description: "Join the conversation" },
  { name: "Chronicles", href: "/chronicles", icon: BookOpen, description: "Read latest stories" },
  { name: "Vault", href: "/vault", icon: Vault, description: "Exclusive content" },
  { name: "Tickets", href: "/tickets", icon: Ticket, description: "Upcoming events" },
  { name: "Premium", href: "/premium", icon: Crown, description: "Upgrade your tier" },
  { name: "Merch", href: "/merch", icon: ShoppingBag, description: "Official merchandise" },
]

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to view your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const levelProgress = ((user.points % 1000) / 1000) * 100

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.username}!</h1>
            <p className="text-muted-foreground">Here's what's happening in your Erigga world</p>
          </div>
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.username} />
            <AvatarFallback className="text-lg">
              {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Tier Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge className={`${getTierColor(user.tier)} text-white`}>{getTierLabel(user.tier)}</Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {user.tier === "admin" ? "Full access" : "Upgrade for more benefits"}
              </p>
            </CardContent>
          </Card>

          {/* Coins Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erigga Coins</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.coins?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                <Button variant="link" className="p-0 h-auto text-xs" asChild>
                  <Link href="/coins">Earn more coins</Link>
                </Button>
              </p>
            </CardContent>
          </Card>

          {/* Level Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Level {user.level || 1}</div>
              <div className="mt-2">
                <Progress value={levelProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {user.points || 0} / {(Math.floor((user.points || 0) / 1000) + 1) * 1000} XP
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Points Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.points?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Keep engaging to earn more!</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Card key={action.name} className="hover:shadow-md transition-shadow cursor-pointer">
                <Link href={action.href}>
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <action.icon className="h-5 w-5 mr-2 text-lime-600" />
                    <CardTitle className="text-lg">{action.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Joined the Erigga Fan Platform</span>
                <span className="text-xs text-muted-foreground ml-auto">Today</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Earned {user.coins} Erigga Coins</span>
                <span className="text-xs text-muted-foreground ml-auto">Today</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Reached Level {user.level}</span>
                <span className="text-xs text-muted-foreground ml-auto">Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Music className="h-5 w-5 mr-2" />
              Featured Content
            </CardTitle>
            <CardDescription>Discover the latest from Erigga</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold">Latest Track</h3>
                <p className="text-sm text-muted-foreground">Check out Erigga's newest release</p>
                <Button variant="outline" size="sm">
                  Listen Now
                </Button>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Upcoming Event</h3>
                <p className="text-sm text-muted-foreground">Don't miss the next live performance</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/tickets">Get Tickets</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
