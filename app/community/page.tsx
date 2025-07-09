"use client"
import { Suspense } from "react"
import { CommunityPageContent } from "./community-page-content"
import { CommunityLoadingSkeleton } from "./loading"
import { Card, CardContent } from "@/components/ui/card"
import { Users, MessageCircle, TrendingUp, Award } from "lucide-react"

interface Category {
  id: number
  name: string
  slug: string
  icon: string
  color: string
}

interface Post {
  id: number
  content: string
  media_url?: string
  media_type?: string
  hashtags: string[]
  vote_count: number
  comment_count: number
  view_count: number
  created_at: string
  user: {
    id: number
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  category: {
    id: number
    name: string
    slug: string
    icon: string
    color: string
  }
  has_voted: boolean
}

function CommunityStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Members</p>
              <p className="text-2xl font-bold">2.5K</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm font-medium">Posts</p>
              <p className="text-2xl font-bold">1.2K</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-2xl font-bold">456</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Top Bars</p>
              <p className="text-2xl font-bold">89</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<CommunityLoadingSkeleton />}>
      <CommunityPageContent />
    </Suspense>
  )
}
