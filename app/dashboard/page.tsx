"use client"

import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  MessageCircle,
  Coins,
  Trophy,
  Music,
  Star,
  Crown,
  Zap,
  TrendingUp,
  Camera,
  Edit,
  Phone,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"

export default function DashboardPage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    setIsUploadingAvatar(true)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("eriggalive-assets")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from("eriggalive-assets").getPublicUrl(uploadData.path)

      // Update user profile
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", profile.id)

      if (updateError) throw updateError

      await refreshProfile()
      toast({
        title: "Success!",
        description: "Profile picture updated successfully.",
      })
    } catch (error: any) {
      console.error("Avatar upload error:", error)
      toast({
        title: "Error",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      })
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {profile?.full_name || profile?.username || user?.email}!
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Here's what's happening in your Erigga Live community
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Badge className={`px-3 py-1 ${getTierColor(profile?.tier || "grassroot")}`}>
                  <Crown className="w-4 h-4 mr-1" />
                  {profile?.tier?.replace("_", " ").toUpperCase() || "GRASSROOT"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Coins Balance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile?.coins?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <Coins className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Level</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.level || 1}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Points</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile?.points?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {profile?.is_verified ? "✅ Verified" : "❌ Not Verified"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tier Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    Your Journey
                  </CardTitle>
                  <CardDescription>Progress through the Erigga Live community tiers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {profile?.tier?.replace("_", " ").toUpperCase() || "GRASSROOT"} Member
                      </span>
                      <span className="text-sm text-gray-500">
                        {getTierProgress(profile?.tier || "grassroot")}% Complete
                      </span>
                    </div>
                    <Progress value={getTierProgress(profile?.tier || "grassroot")} className="h-2" />
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div
                          className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                            getTierProgress(profile?.tier || "grassroot") >= 25 ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                        <span>Grassroot</span>
                      </div>
                      <div className="text-center">
                        <div
                          className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                            getTierProgress(profile?.tier || "grassroot") >= 50 ? "bg-purple-500" : "bg-gray-300"
                          }`}
                        />
                        <span>Pioneer</span>
                      </div>
                      <div className="text-center">
                        <div
                          className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                            getTierProgress(profile?.tier || "grassroot") >= 75 ? "bg-blue-500" : "bg-gray-300"
                          }`}
                        />
                        <span>Elder</span>
                      </div>
                      <div className="text-center">
                        <div
                          className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                            getTierProgress(profile?.tier || "grassroot") >= 100 ? "bg-yellow-500" : "bg-gray-300"
                          }`}
                        />
                        <span>Blood Brotherhood</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Jump into your favorite activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                      <Link href="/community">
                        <MessageCircle className="w-6 h-6 mb-2" />
                        <span className="text-sm">Community</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                      <Link href="/coins">
                        <Coins className="w-6 h-6 mb-2" />
                        <span className="text-sm">Manage Coins</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                      <Link href="/vault">
                        <Music className="w-6 h-6 mb-2" />
                        <span className="text-sm">Media Vault</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-20 flex-col bg-transparent bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 dark:from-purple-900/20 dark:to-blue-900/20"
                    >
                      <Link href="/meet-and-greet">
                        <Phone className="w-6 h-6 mb-2 text-purple-600" />
                        <span className="text-sm text-purple-600 font-medium">Meet & Greet</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                      <Link href="/merch">
                        <Star className="w-6 h-6 mb-2" />
                        <span className="text-sm">Merchandise</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                      <Link href="/settings">
                        <Settings className="w-6 h-6 mb-2" />
                        <span className="text-sm">Settings</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={profile?.avatar_url || "/placeholder-user.jpg"}
                          alt={profile?.username || "User"}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-lg">
                          {profile?.full_name?.charAt(0) ||
                            profile?.username?.charAt(0) ||
                            user?.email?.charAt(0) ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white shadow-md hover:shadow-lg"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? (
                          <div className="animate-spin rounded-full h-3 w-3 border border-primary border-t-transparent" />
                        ) : (
                          <Camera className="h-3 w-3" />
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
                    <div>
                      <p className="font-medium text-lg">{profile?.full_name || profile?.username || "User"}</p>
                      <p className="text-sm text-gray-500">@{profile?.username || "username"}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Member since:</span>
                      <span>{new Date(profile?.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last active:</span>
                      <span>Just now</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verified:</span>
                      <span>{profile?.is_verified ? "✅" : "❌"}</span>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/settings">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Joined community discussion</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Earned {profile?.coins || 0} coins</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span>Updated profile</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                      <span className="text-xs">First Login</span>
                    </div>
                    <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <span className="text-xs">Community Member</span>
                    </div>
                    <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Star className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <span className="text-xs">Active User</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
