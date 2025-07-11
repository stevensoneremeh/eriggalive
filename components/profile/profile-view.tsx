"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LocationSelector } from "@/components/location-selector"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Calendar, Edit, Save, X, MessageSquare, ThumbsUp, Star, Zap, Crown, Flame } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface ProfileViewProps {
  profile: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
    bio?: string
    location?: string
    website?: string
    country?: string
    state_province?: string
    city?: string
    subscription_tier?: string
    created_at: string
  }
  posts: any[]
  comments: any[]
  isOwnProfile: boolean
}

const subscriptionTiers = [
  { value: "Grassroot", label: "Grassroot", icon: Star, color: "text-green-500" },
  { value: "Pioneer", label: "Pioneer", icon: Zap, color: "text-blue-500" },
  { value: "Elder", label: "Elder", icon: Crown, color: "text-purple-500" },
  { value: "Blood", label: "Blood", icon: Flame, color: "text-red-500" },
]

export function ProfileView({ profile, posts, comments, isOwnProfile }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    display_name: profile.display_name || "",
    bio: profile.bio || "",
    website: profile.website || "",
    subscription_tier: profile.subscription_tier || "Grassroot",
    location: {
      country: profile.country || "",
      state: profile.state_province || "",
      city: profile.city || "",
    },
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const currentTier = subscriptionTiers.find((t) => t.value === profile.subscription_tier) || subscriptionTiers[0]
  const TierIcon = currentTier.icon

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: editData.display_name,
          bio: editData.bio,
          website: editData.website,
          subscription_tier: editData.subscription_tier,
          country: editData.location.country,
          state_province: editData.location.state,
          city: editData.location.city,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      })

      setIsEditing(false)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      display_name: profile.display_name || "",
      bio: profile.bio || "",
      website: profile.website || "",
      subscription_tier: profile.subscription_tier || "Grassroot",
      location: {
        country: profile.country || "",
        state: profile.state_province || "",
        city: profile.city || "",
      },
    })
    setIsEditing(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="bg-background/50 border-muted">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl">
                  {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
                  <Badge className={`${currentTier.color} bg-background/50`}>
                    <TierIcon className="h-3 w-3 mr-1" />
                    {currentTier.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground">@{profile.username}</p>
                {(profile.country || profile.city) && (
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{[profile.city, profile.state_province, profile.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    value={editData.display_name}
                    onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                    placeholder="Your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={editData.website}
                    onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                    placeholder="https://www.eriggalive.com/"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Subscription Tier</Label>
                <Select
                  value={editData.subscription_tier}
                  onValueChange={(value) => setEditData({ ...editData, subscription_tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionTiers.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value}>
                        <div className="flex items-center space-x-2">
                          <tier.icon className={`h-4 w-4 ${tier.color}`} />
                          <span>{tier.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <LocationSelector
                  value={editData.location}
                  onChange={(location) => setEditData({ ...editData, location })}
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {profile.bio && <p className="text-sm">{profile.bio}</p>}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {profile.website}
                </a>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Profile Content */}
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Posts ({posts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center space-x-2">
            <ThumbsUp className="h-4 w-4" />
            <span>Comments ({comments.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {posts.length === 0 ? (
            <Card className="bg-background/50 border-muted">
              <CardContent className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No posts yet</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="bg-background/50 border-muted">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      href={`/community/post/${post.id}`}
                      className="text-lg font-semibold hover:text-primary transition-colors"
                    >
                      {post.title}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-3 line-clamp-2">{post.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.upvotes}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comment_count}</span>
                      </span>
                    </div>
                    {post.categories && (
                      <Badge variant="secondary" className="text-xs">
                        {post.categories.icon} {post.categories.name}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {comments.length === 0 ? (
            <Card className="bg-background/50 border-muted">
              <CardContent className="text-center py-8">
                <ThumbsUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No comments yet</p>
              </CardContent>
            </Card>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id} className="bg-background/50 border-muted">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      href={`/community/post/${comment.posts.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Re: {comment.posts.title}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{comment.upvotes}</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
