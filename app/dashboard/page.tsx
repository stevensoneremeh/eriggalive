"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { Music, Users, Calendar, TrendingUp, Home, Camera, Edit2, Save } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function DashboardPage() {
  const { profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editData, setEditData] = useState({
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  if (!profile) {
    return null
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "File too large",
          description: "Please choose an image under 5MB",
          variant: "destructive",
        })
        return
      }

      setUploading(true)

      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}_${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("user-avatars").upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("user-avatars").getPublicUrl(filePath)

      const { error: updateError } = await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", profile.id)

      if (updateError) throw updateError

      await refreshProfile()

      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: editData.full_name,
          bio: editData.bio,
          location: editData.location,
        })
        .eq("id", profile.id)

      if (error) throw error

      await refreshProfile()
      setIsEditing(false)

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center">
            <Home className="h-4 w-4 mr-1" />
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Dashboard</span>
        </nav>

        {/* Welcome Header with Profile */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.[0] || profile.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-transparent"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>

            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={editData.full_name}
                      onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={editData.location}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                      placeholder="Where are you based?"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">Welcome back, {profile.full_name || profile.username}!</h1>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditData({
                          full_name: profile.full_name || "",
                          bio: profile.bio || "",
                          location: profile.location || "",
                        })
                        setIsEditing(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground mb-2">@{profile.username}</p>
                  {profile.bio && <p className="text-sm mb-2">{profile.bio}</p>}
                  {profile.location && <p className="text-sm text-muted-foreground mb-2">📍 {profile.location}</p>}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {profile.tier} Tier
                    </Badge>
                    <Badge variant="secondary">Level {profile.level}</Badge>
                    <Badge variant="outline">{profile.coins} Coins</Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
                  <CoinsIcon className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.coins} Coins</div>
                  <p className="text-xs text-muted-foreground">Use coins to unlock premium content</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Level</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Level {profile.level}</div>
                  <p className="text-xs text-muted-foreground">{profile.points} points earned</p>
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
                  <CardTitle className="text-sm font-medium">Meet & Greet</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Book Now</div>
                  <p className="text-xs text-muted-foreground">Schedule a personal session</p>
                  <Link href="/meet-and-greet" className="mt-2 inline-block">
                    <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                      Book Session
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Jump to your favorite features</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Link href="/community">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Users className="h-4 w-4 mr-2" />
                      Visit Community
                    </Button>
                  </Link>
                  <Link href="/vault">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Music className="h-4 w-4 mr-2" />
                      Media Vault
                    </Button>
                  </Link>
                  <Link href="/coins">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <CoinsIcon className="h-4 w-4 mr-2" />
                      Manage Coins
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Account Status:</span>
                    <Badge variant={profile.is_active ? "default" : "destructive"}>
                      {profile.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Email Verified:</span>
                    <Badge variant={profile.email_verified ? "default" : "secondary"}>
                      {profile.email_verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Member Since:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest interactions on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Joined the community</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Profile updated</p>
                      <p className="text-xs text-muted-foreground">Recent</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Community Activity</CardTitle>
                <CardDescription>Your participation in the Erigga community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">Join the conversation in our community</p>
                  <Link href="/community">
                    <Button>Visit Community</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

// Helper functions remain the same
function getTierDescription(tier: string): string {
  switch (tier.toLowerCase()) {
    case "grassroot":
      return "Basic access to content"
    case "pioneer":
      return "Early access to new releases"
    case "elder":
      return "Exclusive content and event discounts"
    case "blood":
      return "VIP access to all content and events"
    default:
      return "Fan membership tier"
  }
}

function CoinsIcon(props: React.SVGProps<SVGSVGElement>) {
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
