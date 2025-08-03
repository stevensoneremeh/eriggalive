"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
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
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Session, User as SupabaseUser } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type Profile = Database["public"]["Tables"]["users"]["Row"]

interface ProfileClientProps {
  initialAuthData: {
    session: Session
    user: SupabaseUser
    profile: Profile | null
  }
}

export function ProfileClient({ initialAuthData }: ProfileClientProps) {
  const { profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const currentProfile = profile || initialAuthData.profile

  const [formData, setFormData] = useState({
    full_name: currentProfile?.full_name || "",
    username: currentProfile?.username || "",
    bio: currentProfile?.bio || "",
    location: currentProfile?.location || "",
    website: currentProfile?.website || "",
    phone: currentProfile?.phone || "",
    date_of_birth: currentProfile?.date_of_birth || "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    if (!currentProfile) return

    setLoading(true)
    try {
      await updateProfile({
        full_name: formData.full_name,
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
      })

      setIsEditing(false)
    } catch (error) {
      console.error("Profile update error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentProfile) return

    setIsUploadingAvatar(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${currentProfile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("eriggalive-assets")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("eriggalive-assets").getPublicUrl(uploadData.path)

      await updateProfile({ avatar_url: urlData.publicUrl })

      toast.success("Profile picture updated successfully!")
    } catch (error: any) {
      console.error("Avatar upload error:", error)
      toast.error("Failed to update profile picture. Please try again.")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "grassroot":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pioneer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "elder":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "blood_brotherhood":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getTierProgress = (tier: string) => {
    switch (tier) {
      case "grassroot":
        return 25
      case "pioneer":
        return 50
      case "elder":
        return 75
      case "blood_brotherhood":
        return 100
      default:
        return 0
    }
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
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

        {/* Profile Header Card */}
        <Card className="mb-8 border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar Section */}
              <div className="relative">
                <Avatar className="h-32 w-32 ring-4 ring-primary/10">
                  <AvatarImage
                    src={currentProfile?.avatar_url || "/placeholder-user.jpg"}
                    alt={currentProfile?.username}
                  />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-3xl">
                    {currentProfile?.full_name?.charAt(0) || currentProfile?.username?.charAt(0) || "U"}
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
                    {currentProfile?.full_name || currentProfile?.username || "User"}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">@{currentProfile?.username}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                    <Badge className={`px-3 py-1 ${getTierColor(currentProfile?.tier || "grassroot")}`}>
                      <Crown className="w-4 h-4 mr-1" />
                      {currentProfile?.tier?.replace("_", " ").toUpperCase() || "GRASSROOT"}
                    </Badge>
                    {currentProfile?.is_verified && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        ✅ Verified
                      </Badge>
                    )}
                  </div>
                  {currentProfile?.bio && (
                    <p className="text-gray-700 dark:text-gray-300 max-w-md">{currentProfile.bio}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Coins className="w-5 h-5 text-yellow-500 mr-1" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentProfile?.coins?.toLocaleString() || 0}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Coins</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Trophy className="w-5 h-5 text-blue-500 mr-1" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentProfile?.level || 1}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="w-5 h-5 text-green-500 mr-1" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentProfile?.points?.toLocaleString() || 0}
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
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange("full_name", e.target.value)}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
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
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => handleInputChange("location", e.target.value)}
                          placeholder="Your location"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => handleInputChange("website", e.target.value)}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
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
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                            <p className="font-medium">{initialAuthData.user?.email}</p>
                          </div>
                        </div>
                        {currentProfile?.phone && (
                          <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                              <p className="font-medium">{currentProfile.phone}</p>
                            </div>
                          </div>
                        )}
                        {currentProfile?.location && (
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                              <p className="font-medium">{currentProfile.location}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {currentProfile?.website && (
                          <div className="flex items-center space-x-3">
                            <LinkIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Website</p>
                              <a
                                href={currentProfile.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:text-blue-800"
                              >
                                {currentProfile.website}
                              </a>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Member since</p>
                            <p className="font-medium">
                              {new Date(currentProfile?.created_at || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {currentProfile?.date_of_birth && (
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</p>
                              <p className="font-medium">
                                {new Date(currentProfile.date_of_birth).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
                        {currentProfile?.tier?.replace("_", " ").toUpperCase() || "GRASSROOT"}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Current Tier</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Progress to next tier</span>
                        <span className="text-sm text-gray-500">
                          {getTierProgress(currentProfile?.tier || "grassroot")}%
                        </span>
                      </div>
                      <Progress value={getTierProgress(currentProfile?.tier || "grassroot")} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div
                          className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                            getTierProgress(currentProfile?.tier || "grassroot") >= 25 ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                        <p className="text-sm font-medium">Grassroot</p>
                        <p className="text-xs text-gray-500">Entry Level</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div
                          className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                            getTierProgress(currentProfile?.tier || "grassroot") >= 50 ? "bg-purple-500" : "bg-gray-300"
                          }`}
                        />
                        <p className="text-sm font-medium">Pioneer</p>
                        <p className="text-xs text-gray-500">Active Member</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div
                          className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                            getTierProgress(currentProfile?.tier || "grassroot") >= 75 ? "bg-blue-500" : "bg-gray-300"
                          }`}
                        />
                        <p className="text-sm font-medium">Elder</p>
                        <p className="text-xs text-gray-500">Respected</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div
                          className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                            getTierProgress(currentProfile?.tier || "grassroot") >= 100
                              ? "bg-yellow-500"
                              : "bg-gray-300"
                          }`}
                        />
                        <p className="text-sm font-medium">Blood Brotherhood</p>
                        <p className="text-xs text-gray-500">Elite</p>
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
                        Received {currentProfile?.coins || 100} coins for joining
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
  )
}


