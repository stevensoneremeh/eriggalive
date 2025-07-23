import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Users, MessageCircle, Crown } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Music className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Erigga Live</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to <span className="text-indigo-600">Erigga Live</span>
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            The ultimate community platform for Erigga fans. Connect, chat, and access exclusive content.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/signup">
                <Button size="lg" className="w-full">
                  Join the Community
                </Button>
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full bg-transparent">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-indigo-600" />
                  <CardTitle>Community</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect with fellow fans, share posts, and engage in discussions about your favorite artist.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-6 w-6 text-indigo-600" />
                  <CardTitle>Live Chat</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Join real-time conversations in multiple chat rooms with tier-based access and exclusive content.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Crown className="h-6 w-6 text-indigo-600" />
                  <CardTitle>Tier System</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Progress through different tiers to unlock exclusive features, content, and special privileges.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tier Information */}
        <div className="mt-20">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-gray-900">Membership Tiers</h3>
            <p className="mt-4 text-lg text-gray-600">
              Unlock exclusive features as you progress through our tier system
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-green-200">
              <CardHeader>
                <Badge className="bg-green-500 w-fit">Grassroot</Badge>
                <CardTitle className="text-lg">Free Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• General chat access</li>
                  <li>• Community posts</li>
                  <li>• Basic features</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <Badge className="bg-blue-500 w-fit">Pioneer</Badge>
                <CardTitle className="text-lg">Enhanced Access</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Pioneer Lounge access</li>
                  <li>• Priority support</li>
                  <li>• Exclusive content</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader>
                <Badge className="bg-purple-500 w-fit">Elder</Badge>
                <CardTitle className="text-lg">VIP Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Elder Council access</li>
                  <li>• Advanced features</li>
                  <li>• Special privileges</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <Badge className="bg-red-500 w-fit">Blood</Badge>
                <CardTitle className="text-lg">Elite Member</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Blood Brotherhood</li>
                  <li>• All features unlocked</li>
                  <li>• Direct artist access</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Music className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">Erigga Live</span>
            </div>
            <p className="mt-2 text-gray-600">© 2024 Erigga Live. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
