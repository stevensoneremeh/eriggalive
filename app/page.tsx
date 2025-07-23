import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect authenticated users to dashboard
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-blue-600">Erigga Live</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect with fellow fans, chat in real-time, and be part of the ultimate Erigga community
          </p>
          <div className="space-x-4">
            <Link href="/signup">
              <Button size="lg" className="px-8 py-3">
                Join the Community
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 py-3 bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">🎵 Music & Content</CardTitle>
              <CardDescription>Access exclusive tracks, videos, and behind-the-scenes content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Discover new releases, rare tracks, and exclusive content based on your tier level.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">💬 Real-time Chat</CardTitle>
              <CardDescription>Connect with fans in tier-based chat rooms</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Join conversations with fellow fans in general chat or unlock exclusive rooms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">🌟 Community Posts</CardTitle>
              <CardDescription>Share thoughts, vote on posts, and engage with the community</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create posts, vote on content, and build your reputation in the community.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tier System</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-100 p-4 rounded-lg">
              <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
              <h3 className="font-semibold">Grassroot</h3>
              <p className="text-sm text-gray-600">Free tier</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-2"></div>
              <h3 className="font-semibold">Pioneer</h3>
              <p className="text-sm text-gray-600">Premium access</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <div className="w-4 h-4 bg-purple-500 rounded-full mx-auto mb-2"></div>
              <h3 className="font-semibold">Elder</h3>
              <p className="text-sm text-gray-600">VIP benefits</p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg">
              <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-2"></div>
              <h3 className="font-semibold">Blood</h3>
              <p className="text-sm text-gray-600">Ultimate access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
