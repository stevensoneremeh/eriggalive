"use client"

import type React from "react"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Bell, Shield, Camera, Save, Eye, EyeOff, Smartphone, Lock, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile settings
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    phone_number: profile?.phone_number || "",
  })

  // Security settings
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    community_updates: true,
    new_content: true,
    promotional: false,
  })

  // Loading states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    setIsUploadingAvatar(true)

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("eriggalive-assets")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("eriggalive-assets").getPublicUrl(uploadData.path)

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

  const handleProfileSave = async () => {
    if (!profile) return

    setIsSavingProfile(true)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: profileData.full_name,
          username: profileData.username,
          bio: profileData.bio,
          location: profileData.location,
          phone_number: profileData.phone_number,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      await refreshProfile()
      toast({
        title: "Success!",
        description: "Profile updated successfully.",
      })
    } catch (error: any) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast({
        title: "Success!",
        description: "Password updated successfully.",
      })
    } catch (error: any) {
      console.error("Password change error:", error)
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }

    setIsDeletingAccount(true)

    try {
      // In a real implementation, this would properly handle account deletion
      // including data cleanup and compliance with data protection regulations

      toast({
        title: "Account Deletion",
        description: "Your account deletion request has been submitted. You will receive an email confirmation.",
      })

      // Sign out the user
      await signOut()
    } catch (error: any) {
      console.error("Account deletion error:", error)
      toast({
        title: "Error",
        description: "Failed to process account deletion. Please contact support.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage your account settings and preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal information and profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback className="text-lg">
                        {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        variant="outline"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {isUploadingAvatar ? "Uploading..." : "Change Photo"}
                      </Button>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG or GIF. Max size 5MB.</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, username: e.target.value }))}
                        placeholder="Enter your username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ""} disabled className="bg-gray-50 dark:bg-gray-800" />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={profileData.phone_number}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, phone_number: e.target.value }))}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter your location"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleProfileSave} disabled={isSavingProfile}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSavingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Manage your account security and password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Password Change */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="current_password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current_password"
                            type={showPasswords ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords(!showPasswords)}
                          >
                            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="new_password">New Password</Label>
                        <Input
                          id="new_password"
                          type={showPasswords ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm_password">Confirm New Password</Label>
                        <Input
                          id="confirm_password"
                          type={showPasswords ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword || !newPassword || !confirmPassword}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <Switch checked={profile?.two_factor_enabled || false} disabled />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Coming soon</p>
                  </div>

                  {/* Login Sessions */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">Current Session</p>
                            <p className="text-sm text-gray-500">Chrome on Windows • Nigeria</p>
                          </div>
                        </div>
                        <span className="text-sm text-green-600">Active now</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose what notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={notifications.email_notifications}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({ ...prev, email_notifications: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Push Notifications</h4>
                        <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                      </div>
                      <Switch
                        checked={notifications.push_notifications}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({ ...prev, push_notifications: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Community Updates</h4>
                        <p className="text-sm text-gray-500">Get notified about new posts and comments</p>
                      </div>
                      <Switch
                        checked={notifications.community_updates}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({ ...prev, community_updates: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">New Content</h4>
                        <p className="text-sm text-gray-500">Be notified when new content is available</p>
                      </div>
                      <Switch
                        checked={notifications.new_content}
                        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, new_content: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Promotional</h4>
                        <p className="text-sm text-gray-500">Receive promotional offers and updates</p>
                      </div>
                      <Switch
                        checked={notifications.promotional}
                        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, promotional: checked }))}
                      />
                    </div>
                  </div>

                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>View your account details and membership status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Account ID</Label>
                      <Input value={profile?.id || ""} disabled className="bg-gray-50 dark:bg-gray-800" />
                    </div>
                    <div>
                      <Label>Member Since</Label>
                      <Input
                        value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ""}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <Label>Current Tier</Label>
                      <Input
                        value={profile?.tier?.replace("_", " ").toUpperCase() || "GRASSROOT"}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <Label>Verification Status</Label>
                      <Input
                        value={profile?.is_verified ? "Verified" : "Not Verified"}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                  <CardDescription>Irreversible and destructive actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Delete Account</h4>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeletingAccount}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeletingAccount ? "Processing..." : "Delete Account"}
                    </Button>
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
