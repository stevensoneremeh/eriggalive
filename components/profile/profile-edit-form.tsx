"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Camera,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  MapPin,
  User,
  Shield,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  date_of_birth: z.string().optional(),
  social_links: z
    .object({
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      youtube: z.string().optional(),
    })
    .optional(),
  is_profile_public: z.boolean(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfileEditForm() {
  const { profile, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      website: profile?.website || "",
      date_of_birth: profile?.date_of_birth || "",
      social_links: {
        twitter: profile?.social_links?.twitter || "",
        instagram: profile?.social_links?.instagram || "",
        facebook: profile?.social_links?.facebook || "",
        youtube: profile?.social_links?.youtube || "",
      },
      is_profile_public: profile?.is_profile_public ?? true,
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile")
      }

      toast.success("Profile updated successfully!")
      await refreshProfile()
    } catch (error) {
      console.error("Profile update error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
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

      toast.success("Profile image updated successfully!")
      await refreshProfile()
    } catch (error) {
      console.error("Image upload error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 80) return "text-green-600"
    if (completeness >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Completeness Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Profile Completeness
          </CardTitle>
          <CardDescription>Complete your profile to unlock all features and improve your visibility</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className={`text-sm font-bold ${getCompletenessColor(profile?.profile_completeness || 0)}`}>
                {profile?.profile_completeness || 0}%
              </span>
            </div>
            <Progress value={profile?.profile_completeness || 0} className="h-2" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <Badge variant={profile?.username ? "default" : "secondary"}>
                Username {profile?.username ? "✓" : "✗"}
              </Badge>
              <Badge variant={profile?.full_name ? "default" : "secondary"}>
                Full Name {profile?.full_name ? "✓" : "✗"}
              </Badge>
              <Badge variant={profile?.profile_image_url ? "default" : "secondary"}>
                Photo {profile?.profile_image_url ? "✓" : "✗"}
              </Badge>
              <Badge variant={profile?.bio ? "default" : "secondary"}>Bio {profile?.bio ? "✓" : "✗"}</Badge>
              <Badge variant={profile?.date_of_birth ? "default" : "secondary"}>
                Birthday {profile?.date_of_birth ? "✓" : "✗"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Photo
          </CardTitle>
          <CardDescription>Upload a profile photo to help others recognize you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.profile_image_url || profile?.avatar_url || undefined} alt={profile?.username || undefined} />
              <AvatarFallback className="text-lg">
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {isUploadingImage ? "Uploading..." : "Change Photo"}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP or GIF. Max 5MB.</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" {...form.register("full_name")} placeholder="Enter your full name" />
                {form.formState.errors.full_name && (
                  <p className="text-sm text-red-600">{form.formState.errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input id="username" {...form.register("username")} placeholder="Enter your username" />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-600">{form.formState.errors.username.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" {...form.register("bio")} placeholder="Tell us about yourself..." rows={3} />
              <p className="text-xs text-muted-foreground">{form.watch("bio")?.length || 0}/500 characters</p>
              {form.formState.errors.bio && <p className="text-sm text-red-600">{form.formState.errors.bio.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input id="location" {...form.register("location")} placeholder="City, Country" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </Label>
                <Input id="date_of_birth" type="date" {...form.register("date_of_birth")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              <Input id="website" {...form.register("website")} placeholder="https://yourwebsite.com" />
              {form.formState.errors.website && (
                <p className="text-sm text-red-600">{form.formState.errors.website.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>Connect your social media accounts to your profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Label>
                <Input id="twitter" {...form.register("social_links.twitter")} placeholder="@username" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input id="instagram" {...form.register("social_links.instagram")} placeholder="@username" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Label>
                <Input id="facebook" {...form.register("social_links.facebook")} placeholder="facebook.com/username" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube" className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </Label>
                <Input id="youtube" {...form.register("social_links.youtube")} placeholder="youtube.com/@username" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="is_profile_public">Public Profile</Label>
                <p className="text-sm text-muted-foreground">Allow others to view your profile information</p>
              </div>
              <Switch
                id="is_profile_public"
                checked={form.watch("is_profile_public")}
                onCheckedChange={(checked) => form.setValue("is_profile_public", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
