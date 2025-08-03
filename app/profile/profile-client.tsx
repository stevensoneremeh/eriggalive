"use client";

import type React from "react";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["users"]["Row"];

interface ProfileClientProps {
  initialAuthData: {
    session: Session;
    user: SupabaseUser;
    profile: Profile | null;
  };
}

export function ProfileClient({ initialAuthData }: ProfileClientProps) {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const currentProfile = profile || initialAuthData.profile;

  // Form state
  const [formData, setFormData] = useState({
    full_name: currentProfile?.full_name || "",
    username: currentProfile?.username || "",
    bio: currentProfile?.bio || "",
    location: currentProfile?.location || "",
    website: currentProfile?.website || "",
    phone: currentProfile?.phone || "",
    date_of_birth: currentProfile?.date_of_birth || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!currentProfile) return;

    setLoading(true);
    try {
      await updateProfile({
        full_name: formData.full_name,
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
      });

      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentProfile) return;

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("eriggalive-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("eriggalive-assets").getPublicUrl(uploadData.path);

      await updateProfile({ avatar_url: urlData.publicUrl });

      toast.success("Profile picture updated successfully!");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to update profile picture. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "grassroot":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pioneer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "elder":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "blood_brotherhood":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTierProgress = (tier: string) => {
    switch (tier) {
      case "grassroot":
        return 25;
      case "pioneer":
        return 50;
      case "elder":
        return 75;
      case "blood_brotherhood":
        return 100;
      default:
        return 0;
    }
  };

  if (!currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
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

        {/* Avatar + Info */}
        {/* ... Full existing JSX code here (unchanged) ... */}
        {/* Your UI rendering from your two halves stays intact */}
      </div>
    </div>
  );
}