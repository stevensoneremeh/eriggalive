"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Crown, QrCode, Ticket, Trophy, Play, TrendingUp, Eye, Heart, MessageCircle } from "lucide-react"

const user = {
  username: "StreetSoldier23",
  tier: "Warri Elite",
  level: 15,
  erigmaId: "ESG-2024-001523",
  avatar: "/placeholder.svg?height=80&width=80",
  points: 2450,
  nextLevelPoints: 3000,
  joinDate: "March 2024",
}

const activities = [
  { type: "comment", content: "Commented on 'Street Anthem 2024'", time: "2h ago", points: 10 },
  { type: "like", content: "Liked WarriKing23's bars", time: "4h ago", points: 5 },
  { type: "purchase", content: "Bought Paper Boi hoodie", time: "1d ago", points: 50 },
  { type: "exclusive", content: "Watched exclusive studio session", time: "2d ago", points: 25 },
]

const tickets = [
  { event: "Warri Live Show", date: "Dec 25, 2024", venue: "Warri City Stadium", status: "confirmed" },
  { event: "Lagos Concert", date: "Jan 15, 2025", venue: "Eko Hotel", status: "pending" },
]

const exclusiveContent = [
  { title: "Behind the Scenes: Studio Session #3", type: "video", watched: true },
  { title: "Freestyle Friday: Warri Stories", type: "audio", watched: true },
  { title: "Exclusive Interview: The Journey", type: "video", watched: false },
]

export default function DashboardPage() {
  const progressPercentage = (user.points / user.nextLevelPoints) * 100

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="font-street text-4xl md:text-6xl text-gradient mb-4">YOUR DASHBOARD</h1>
          <p className="text-muted-foreground">Track your journey in the Erigga community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card/50 border-orange-500/20">
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="h-20 w-20 border-4 border-orange-500">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>SS</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
                    <Crown className="h-4 w-4 text-black" />
                  </div>
                </div>

                <h2 className="text-xl font-bold mb-2">{user.username}</h2>
                <Badge className="bg-orange-500 text-black mb-4">{user.tier}</Badge>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level:</span>
                    <span className="font-semibold">{user.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Erigma ID:</span>
                    <span className="font-mono text-xs">{user.erigmaId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member Since:</span>
                    <span>{user.joinDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Street Pass QR */}
            <Card className="bg-gradient-to-br from-orange-500/20 to-gold-400/20 border-orange-500/40">
              <CardHeader>
                <CardTitle className="text-center flex items-center justify-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Street Pass
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="w-32 h-32 bg-white rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-black" />
                </div>
                <p className="text-xs text-muted-foreground">Show this at events for VIP access</p>
              </CardContent>
            </Card>

            {/* Level Progress */}
            <Card className="bg-card/50 border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Fan Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Level {user.level}</span>
                    <span>Level {user.level + 1}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">
                      {user.points} / {user.nextLevelPoints} points
                    </span>
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    {user.nextLevelPoints - user.points} points to next level
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card/50 border-orange-500/20">
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 text-gold-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{user.points}</div>
                  <div className="text-xs text-muted-foreground">Points Earned</div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-orange-500/20">
                <CardContent className="p-4 text-center">
                  <Eye className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs text-muted-foreground">Exclusives Watched</div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-orange-500/20">
                <CardContent className="p-4 text-center">
                  <Ticket className="h-8 w-8 text-gold-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-xs text-muted-foreground">Event Tickets</div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-orange-500/20">
                <CardContent className="p-4 text-center">
                  <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">89</div>
                  <div className="text-xs text-muted-foreground">Community Likes</div>
                </CardContent>
              </Card>
            </div>

            {/* Event Tickets */}
            <Card className="bg-card/50 border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-orange-500" />
                  Your Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tickets.map((ticket, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                      <div>
                        <h4 className="font-semibold">{ticket.event}</h4>
                        <p className="text-sm text-muted-foreground">
                          {ticket.date} • {ticket.venue}
                        </p>
                      </div>
                      <Badge variant={ticket.status === "confirmed" ? "default" : "secondary"}>{ticket.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Exclusive Content */}
            <Card className="bg-card/50 border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-gold-400" />
                  Exclusive Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exclusiveContent.map((content, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Play className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="font-medium text-sm">{content.title}</p>
                          <p className="text-xs text-muted-foreground">{content.type}</p>
                        </div>
                      </div>
                      <Badge variant={content.watched ? "default" : "outline"}>
                        {content.watched ? "Watched" : "New"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-black">Browse Vault</Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-card/50 border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-orange-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div>
                        <p className="text-sm">{activity.content}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      <Badge variant="outline" className="text-orange-500 border-orange-500">
                        +{activity.points} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
