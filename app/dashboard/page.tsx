"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { Music, Users, Calendar, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Mock data for the dashboard
const mockRecentTracks = [
  { id: 1, title: "Send Her Money", artist: "Erigga ft. Yemi Alade", plays: 5200000 },
  { id: 2, title: "The Fear of God", artist: "Erigga", plays: 3800000 },
  { id: 3, title: "Area to the World", artist: "Erigga ft. Zlatan", plays: 4100000 },
]

const mockUpcomingEvents = [
  { id: 1, title: "Erigga Live in Lagos", date: "Dec 31, 2024", venue: "Eko Hotel & Suites" },
  { id: 2, title: "Street Motivation Tour - Abuja", date: "Nov 15, 2024", venue: "ICC Abuja" },
]

const mockCommunityPosts = [
  { id: 1, author: "PaperBoi_Fan", content: "Just got my tickets for the Lagos show! Who else is going?", likes: 24 },
  { id: 2, author: "WarriToTheWorld", content: "That new freestyle is 🔥🔥🔥", likes: 18 },
]

export default function DashboardPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  if (!profile) {
    return null // This will be handled by the DashboardLayout
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile.username}!</h1>
          <p className="text-muted-foreground">Here's what's happening with your Erigga fan account today.</p>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
                  <Coins className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.coins} Coins</div>
                  <p className="text-xs text-muted-foreground">Use coins to unlock premium content</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Membership Tier</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{profile.tier}</div>
                  <p className="text-xs text-muted-foreground">{getTierDescription(profile.tier)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">Events in the next 3 months</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New Releases</CardTitle>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">New tracks this month</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Coin Management</CardTitle>
                  <CardDescription>Buy, withdraw, and manage your Erigga Coins</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button asChild className="bg-green-500 hover:bg-green-600">
                      <Link href="/coins">
                        <Coins className="h-4 w-4 mr-2" />
                        Manage Coins
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Tracks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentTracks.map((track) => (
                      <div key={track.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{track.title}</p>
                          <p className="text-sm text-muted-foreground">{track.artist}</p>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-muted-foreground mr-1" />
                          <span className="text-sm">{formatNumber(track.plays)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockUpcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.venue}</p>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                          <span className="text-sm">{event.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Community Activity</CardTitle>
                <CardDescription>Recent posts from the Erigga fan community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCommunityPosts.map((post) => (
                    <div key={post.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center mb-2">
                        <span className="font-medium mr-2">{post.author}</span>
                        <span className="text-xs text-muted-foreground">Posted recently</span>
                      </div>
                      <p>{post.content}</p>
                      <div className="flex items-center mt-2 text-sm text-muted-foreground">
                        <span>{post.likes} likes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="music" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Music Library</CardTitle>
                <CardDescription>Access your favorite Erigga tracks and albums</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Visit the Media Vault for full access to music content.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Community Feed</CardTitle>
                <CardDescription>Connect with other Erigga fans</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Visit the Community page to see all posts and discussions.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Concerts, tours, and meet & greets</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Visit the Events page to see all upcoming events and purchase tickets.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

// Helper function to format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

// Helper function to get tier descriptions
function getTierDescription(tier: string): string {
  switch (tier.toLowerCase()) {
    case "grassroot":
      return "Basic access to content"
    case "pioneer":
      return "Early access to new releases"
    case "elder":
      return "Exclusive content and event discounts"
    case "blood_brotherhood":
      return "VIP access to all content and events"
    default:
      return "Fan membership tier"
  }
}

// Coins icon component
function Coins(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  )
}
