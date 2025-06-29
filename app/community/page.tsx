import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, MessageCircle, TrendingUp, Crown } from "lucide-react"

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="hidden lg:block">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommunityStats() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <TrendingUp className="w-5 h-5 mr-2" />
          Community Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-600">12,450</div>
              <div className="text-xs text-blue-600">Members</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <MessageCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-600">89</div>
              <div className="text-xs text-green-600">Posts Today</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Now</span>
              <span className="font-semibold">234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Posts</span>
              <span className="font-semibold">5,678</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TopContributors() {
  const contributors = [
    { username: "eriggaofficial", votes: 2500, tier: "blood" },
    { username: "warriking", votes: 1800, tier: "pioneer" },
    { username: "naijafan", votes: 1200, tier: "grassroot" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Crown className="w-5 h-5 mr-2" />
          Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contributors.map((user, index) => (
            <div key={user.username} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <div>
                  <div className="font-medium text-sm">{user.username}</div>
                  <div className="text-xs text-gray-500">{user.votes} votes</div>
                </div>
              </div>
              <Badge variant="secondary">{user.tier}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function WelcomeMessage() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Welcome to the Erigga Community</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">
          Connect with fellow fans, share your passion for music, and join the conversation.
        </p>
        <div className="flex gap-4">
          <Button>Join Discussion</Button>
          <Button variant="outline">Browse Posts</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentPosts() {
  const posts = [
    {
      id: 1,
      title: "New Erigga track is fire! 🔥",
      author: "musicfan123",
      time: "2 hours ago",
      votes: 24,
      comments: 8,
    },
    {
      id: 2,
      title: "Concert review: Erigga live in Lagos",
      author: "concertgoer",
      time: "5 hours ago",
      votes: 18,
      comments: 12,
    },
    {
      id: 3,
      title: "Favorite Erigga lyrics discussion",
      author: "lyricsmaster",
      time: "1 day ago",
      votes: 35,
      comments: 23,
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Recent Posts</h2>
      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                by {post.author} • {post.time}
              </span>
              <div className="flex items-center space-x-4">
                <span>{post.votes} votes</span>
                <span>{post.comments} comments</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Community</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Connect with fellow Erigga fans, share your passion for music, and join the conversation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Suspense fallback={<LoadingFallback />}>
              <WelcomeMessage />
              <RecentPosts />
            </Suspense>
          </div>

          <div className="hidden lg:block space-y-6">
            <CommunityStats />
            <TopContributors />
          </div>
        </div>
      </div>
    </div>
  )
}
