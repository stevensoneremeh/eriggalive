"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Shield, Palette, Crown, Save } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

export function SettingsClient() {
  const { profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    website: profile?.website || "",
  })
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    community_updates: true,
    event_reminders: true,
  })

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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateProfile(formData)
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = async () => {
    setLoading(true)
    try {
      await updateProfile({ preferences: { ...profile?.preferences, notifications } })
      toast.success("Notification settings updated!")
    } catch (error) {
      toast.error("Failed to update notification settings")
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-20 pb-8"
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Settings
            </h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>

          {/* Settings Tabs */}
          <Card>
            <Tabs defaultValue="profile" className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">Notifications</span>
                  </TabsTrigger>
                  <TabsTrigger value="privacy" className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Privacy</span>
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="flex items-center space-x-2">
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Appearance</span>
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
                      <AvatarFallback className="text-2xl font-bold">
                        {profile.full_name?.charAt(0) || profile.username?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{profile.full_name || profile.username}</h3>
                      <p className="text-muted-foreground">@{profile.username}</p>
                      <Badge className={`mt-1 ${getTierColor(profile.tier)}`}>
                        <Crown className="w-3 h-3 mr-1" />
                        {profile.tier?.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="Your username"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="Your location"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://your-website.com"
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full md:w-auto">
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email_notifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                        <Switch
                          id="email_notifications"
                          checked={notifications.email_notifications}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, email_notifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="push_notifications">Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive push notifications</p>
                        </div>
                        <Switch
                          id="push_notifications"
                          checked={notifications.push_notifications}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, push_notifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="community_updates">Community Updates</Label>
                          <p className="text-sm text-muted-foreground">Get notified about community activity</p>
                        </div>
                        <Switch
                          id="community_updates"
                          checked={notifications.community_updates}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, community_updates: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="event_reminders">Event Reminders</Label>
                          <p className="text-sm text-muted-foreground">Reminders for upcoming events</p>
                        </div>
                        <Switch
                          id="event_reminders"
                          checked={notifications.event_reminders}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, event_reminders: checked })
                          }
                        />
                      </div>
                    </div>

                    <Button onClick={handleNotificationUpdate} disabled={loading} className="mt-6">
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? "Saving..." : "Save Notification Settings"}
                    </Button>
                  </div>
                </TabsContent>

                {/* Privacy Tab */}
                <TabsContent value="privacy" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Profile Visibility</Label>
                          <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Show Online Status</Label>
                          <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Allow Direct Messages</Label>
                          <p className="text-sm text-muted-foreground">Allow other users to message you directly</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Appearance Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Theme</Label>
                        <p className="text-sm text-muted-foreground mb-3">Choose your preferred theme</p>
                        <div className="grid grid-cols-3 gap-3">
                          <Button variant="outline" className="h-20 flex flex-col space-y-2 bg-transparent">
                            <div className="w-6 h-6 bg-white border rounded"></div>
                            <span className="text-xs">Light</span>
                          </Button>
                          <Button variant="outline" className="h-20 flex flex-col space-y-2 bg-transparent">
                            <div className="w-6 h-6 bg-gray-800 rounded"></div>
                            <span className="text-xs">Dark</span>
                          </Button>
                          <Button variant="outline" className="h-20 flex flex-col space-y-2 bg-transparent">
                            <div className="w-6 h-6 bg-gradient-to-r from-white to-gray-800 rounded"></div>
                            <span className="text-xs">System</span>
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Compact Mode</Label>
                          <p className="text-sm text-muted-foreground">Use a more compact layout</p>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Animations</Label>
                          <p className="text-sm text-muted-foreground">Enable smooth animations</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
