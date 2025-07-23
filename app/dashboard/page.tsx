import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogoutButton } from "@/components/logout-button"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.username || user.email}!</h1>
          <p className="text-gray-600">Manage your Erigga Live experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Community</CardTitle>
              <CardDescription>Join discussions and share content</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/community">
                <Button className="w-full">Visit Community</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chat Rooms</CardTitle>
              <CardDescription>Connect with other fans in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/chat">
                <Button className="w-full">Join Chat</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Tier: {profile?.tier || "grassroot"} | Coins: {profile?.coins_balance || 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/profile/${profile?.username}`}>
                <Button variant="outline" className="w-full bg-transparent">
                  View Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
