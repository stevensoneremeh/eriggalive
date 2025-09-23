"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  User,
  Camera,
  Edit,
  Save,
  Crown,
  Coins,
  Trophy,
  Calendar,
  MapPin,
  LinkIcon,
  Phone,
  Mail,
  Star,
  TrendingUp,
  MessageCircle,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Shield,
  CheckCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    website: profile?.website || "",
    phone: profile?.phone || "",
    date_of_birth: profile?.date_of_birth || "",
    social_links: {
      twitter: profile?.social_links?.twitter || "",
      instagram: profile?.social_links?.instagram || "",
      facebook: profile?.social_links?.facebook || "",
      youtube: profile?.social_links?.youtube || "",
    },
    is_profile_public: profile?.is_profile_public ?? true,
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith("social_links.")) {
      const socialField = field.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [socialField]: value as string,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    setLoading(true)
    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile")
      }

      await refreshProfile()
      setIsEditing(false)
      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
      })
    } catch (error: any) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/profile/upload-image", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload image")
      }

      await refreshProfile()
      toast({
        title: "Success!",
        description: "Profile picture updated successfully.",
      })
    } catch (error: any) {
      console.error("Avatar upload error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "erigga_citizen":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "erigga_indigen":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "enterprise":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    }
  }

  const getTierProgress = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "erigga_citizen":
        return 33
      case "erigga_indigen":
        return 66
      case "enterprise":
        return 100
      default:
        return 33
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "erigga_citizen":
        return "Erigga Citizen"
      case "erigga_indigen":
        return "Erigga Indigen"
      case "enterprise":
        return "Enterprise"
      default:
        return "Erigga Citizen"
    }
  }

  const getProfileCompleteness = () => {
    return profile?.profile_completeness || 0
  }

  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 80) return "text-green-600"
    if (completeness >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
                <p className="text-gray-600 dark:text-gray-300">Manage your personal information and preferences</p>
              </div>
            </div>
          </div>

          <Card className="mb-8 border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Profile Completeness
              </CardTitle>
              <CardDescription>
                Complete your profile to unlock all features and improve your visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className={`text-sm font-bold ${getCompletenessColor(getProfileCompleteness())}`}>
                    {getProfileCompleteness()}%
                  </span>
                </div>
                <Progress value={getProfileCompleteness()} className="h-2" />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <Badge variant={profile?.username ? "default" : "secondary"}>
                    Username {profile?.username ? "✓" : "✗"}
                  </Badge>
                  <Badge variant={profile?.full_name ? "default" : "secondary"}>
                    Full Name {profile?.full_name ? "✓" : "✗"}
                  </Badge>
                  <Badge variant={profile?.profile_image_url || profile?.avatar_url ? "default" : "secondary"}>
                    Photo {profile?.profile_image_url || profile?.avatar_url ? "✓" : "✗"}
                  </Badge>
                  <Badge variant={profile?.bio ? "default" : "secondary"}>Bio {profile?.bio ? "✓" : "✗"}</Badge>
                  <Badge variant={profile?.date_of_birth ? "default" : "secondary"}>
                    Birthday {profile?.date_of_birth ? "✓" : "✗"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Header Card */}
          <Card className="mb-8 border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                {/* Avatar Section */}
                <div className="relative">
                  <Avatar className="h-32 w-32 ring-4 ring-primary/10">
                    <AvatarImage
                      src={profile?.profile_image_url || profile?.avatar_url || user?.user_metadata?.avatar_url || "/placeholder-user.jpg"}
                      alt={profile?.username || "Profile"}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-3xl">
                      {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-white shadow-lg hover:shadow-xl"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <div className="animate-spin rounded-full h-4 w-4 border border-primary border-t-transparent" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-4">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {profile?.full_name || profile?.username || "User"}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">@{profile?.username}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                      <Badge className={`px-3 py-1 ${getTierColor(profile?.tier || "grassroot")}`}>
                        <Crown className="w-4 h-4 mr-1" />
                        {profile?.tier?.replace("_", " ").toUpperCase() || "GRASSROOT"}
                      </Badge>
                      {profile?.is_verified && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          ✅ Verified
                        </Badge>
                      )}
                    </div>
                    {profile?.bio && <p className="text-gray-700 dark:text-gray-300 max-w-md">{profile.bio}</p>}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Coins className="w-5 h-5 text-yellow-500 mr-1" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {profile?.coins?.toLocaleString() || 0}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Coins</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Trophy className="w-5 h-5 text-blue-500 mr-1" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.level || 1}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <TrendingUp className="w-5 h-5 text-green-500 mr-1" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {profile?.points?.toLocaleString() || 0}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Points</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditing ? "Cancel Edit" : "Edit Profile"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Content */}
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Profile Details</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Profile Details Tab */}
            <TabsContent value="details">
              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    {isEditing
                      ? "Update your personal information below."
                      : "Your personal information and contact details."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEditing ? (
                    // Edit Mode
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name *</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => handleInputChange("full_name", e.target.value)}
                            placeholder="Your full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username *</Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => handleInputChange("username", e.target.value)}
                            placeholder="Your username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            placeholder="+234 xxx xxx xxxx"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location
                          </Label>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => handleInputChange("location", e.target.value)}
                            placeholder="City, Country"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Website
                          </Label>
                          <Input
                            id="website"
                            value={formData.website}
                            onChange={(e) => handleInputChange("website", e.target.value)}
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date_of_birth" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date of Birth
                          </Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={formData.date_of_birth}
                            onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => handleInputChange("bio", e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">{formData.bio?.length || 0}/500 characters</p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Social Links</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="twitter" className="flex items-center gap-2">
                              <Twitter className="h-4 w-4" />
                              Twitter
                            </Label>
                            <Input
                              id="twitter"
                              value={formData.social_links.twitter}
                              onChange={(e) => handleInputChange("social_links.twitter", e.target.value)}
                              placeholder="@username"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="instagram" className="flex items-center gap-2">
                              <Instagram className="h-4 w-4" />
                              Instagram
                            </Label>
                            <Input
                              id="instagram"
                              value={formData.social_links.instagram}
                              onChange={(e) => handleInputChange("social_links.instagram", e.target.value)}
                              placeholder="@username"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="facebook" className="flex items-center gap-2">
                              <Facebook className="h-4 w-4" />
                              Facebook
                            </Label>
                            <Input
                              id="facebook"
                              value={formData.social_links.facebook}
                              onChange={(e) => handleInputChange("social_links.facebook", e.target.value)}
                              placeholder="facebook.com/username"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="youtube" className="flex items-center gap-2">
                              <Youtube className="h-4 w-4" />
                              YouTube
                            </Label>
                            <Input
                              id="youtube"
                              value={formData.social_links.youtube}
                              onChange={(e) => handleInputChange("social_links.youtube", e.target.value)}
                              placeholder="youtube.com/@username"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Privacy Settings
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label htmlFor="is_profile_public">Public Profile</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow others to view your profile information
                            </p>
                          </div>
                          <Switch
                            id="is_profile_public"
                            checked={formData.is_profile_public}
                            onCheckedChange={(checked) => handleInputChange("is_profile_public", checked)}
                          />
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <Button onClick={handleSaveProfile} disabled={loading}>
                          <Save className="w-4 h-4 mr-2" />
                          {loading ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                              <p className="font-medium">{user?.email}</p>
                            </div>
                          </div>
                          {profile?.phone && (
                            <div className="flex items-center space-x-3">
                              <Phone className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                                <p className="font-medium">{profile.phone}</p>
                              </div>
                            </div>
                          )}
                          {profile?.location && (
                            <div className="flex items-center space-x-3">
                              <MapPin className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                                <p className="font-medium">{profile.location}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          {profile?.website && (
                            <div className="flex items-center space-x-3">
                              <LinkIcon className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Website</p>
                                <a
                                  href={profile.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-600 hover:text-blue-800"
                                >
                                  {profile.website}
                                </a>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Member since</p>
                              <p className="font-medium">
                                {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {profile?.date_of_birth && (
                            <div className="flex items-center space-x-3">
                              <Calendar className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</p>
                                <p className="font-medium">{new Date(profile.date_of_birth).toLocaleDateString()}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {(profile?.social_links?.twitter ||
                        profile?.social_links?.instagram ||
                        profile?.social_links?.facebook ||
                        profile?.social_links?.youtube) && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Social Links</h3>
                          <div className="flex flex-wrap gap-4">
                            {profile?.social_links?.twitter && (
                              <a
                                href={`https://twitter.com/${profile.social_links.twitter.replace("@", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                              >
                                <Twitter className="h-4 w-4" />
                                {profile.social_links.twitter}
                              </a>
                            )}
                            {profile?.social_links?.instagram && (
                              <a
                                href={`https://instagram.com/${profile.social_links.instagram.replace("@", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-pink-500 hover:text-pink-600"
                              >
                                <Instagram className="h-4 w-4" />
                                {profile.social_links.instagram}
                              </a>
                            )}
                            {profile?.social_links?.facebook && (
                              <a
                                href={
                                  profile.social_links.facebook.startsWith("http")
                                    ? profile.social_links.facebook
                                    : `https://facebook.com/${profile.social_links.facebook}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                              >
                                <Facebook className="h-4 w-4" />
                                Facebook
                              </a>
                            )}
                            {profile?.social_links?.youtube && (
                              <a
                                href={
                                  profile.social_links.youtube.startsWith("http")
                                    ? profile.social_links.youtube
                                    : `https://youtube.com/${profile.social_links.youtube}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-red-500 hover:text-red-600"
                              >
                                <Youtube className="h-4 w-4" />
                                YouTube
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress">
              <div className="space-y-6">
                {/* Tier Progress */}
                <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Crown className="w-5 h-5 mr-2" />
                      Tier Progress
                    </CardTitle>
                    <CardDescription>Your journey through the Erigga Live community tiers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                          {profile?.tier?.replace("_", " ").toUpperCase() || "GRASSROOT"}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">Current Tier</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Progress to next tier</span>
                          <span className="text-sm text-gray-500">
                            {getTierProgress(profile?.tier || "erigga_citizen")}%
                          </span>
                        </div>
                        <Progress value={getTierProgress(profile?.tier || "erigga_citizen")} className="h-3" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div
                            className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                              getTierProgress(profile?.tier || "erigga_citizen") >= 25 ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />
                          <p className="text-sm font-medium">Erigga Citizen</p>
                          <p className="text-xs text-gray-500">Entry Level</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div
                            className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                              getTierProgress(profile?.tier || "erigga_citizen") >= 50 ? "bg-purple-500" : "bg-gray-300"
                            }`}
                          />
                          <p className="text-sm font-medium">Erigga Indigen</p>
                          <p className="text-xs text-gray-500">Active Member</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div
                            className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                              getTierProgress(profile?.tier || "erigga_citizen") >= 75 ? "bg-blue-500" : "bg-gray-300"
                            }`}
                          />
                          <p className="text-sm font-medium">Enterprise</p>
                          <p className="text-xs text-gray-500">Premium</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <div
                            className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                              getTierProgress(profile?.tier || "erigga_citizen") >= 100 ? "bg-yellow-500" : "bg-gray-300"
                            }`}
                          />
                          <p className="text-sm font-medium">Elite</p>
                          <p className="text-xs text-gray-500">Exclusive</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="w-5 h-5 mr-2" />
                      Achievements
                    </CardTitle>
                    <CardDescription>Your accomplishments in the community</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <p className="font-medium text-sm">First Login</p>
                        <p className="text-xs text-gray-500">Welcome to the community!</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="font-medium text-sm">Community Member</p>
                        <p className="text-xs text-gray-500">Joined the discussion</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Star className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="font-medium text-sm">Active User</p>
                        <p className="text-xs text-gray-500">Regular participation</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your recent actions and interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div className="flex-1">
                        <p className="font-medium">Profile Updated</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Updated your profile information</p>
                      </div>
                      <span className="text-xs text-gray-500">Just now</span>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <div className="flex-1">
                        <p className="font-medium">Joined Community</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Became a member of Erigga Live</p>
                      </div>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <div className="flex-1">
                        <p className="font-medium">Earned Coins</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Received {profile?.coins || 100} coins for joining
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">1 day ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
