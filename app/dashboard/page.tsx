"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Music, MessageSquare, Ticket, Calendar, Clock, Award, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import { useTheme } from "@/contexts/theme-context"

// Mock data for charts
const activityData = [
  { name: "Mon", points: 20 },
  { name: "Tue", points: 40 },
  { name: "Wed", points: 30 },
  { name: "Thu", points: 70 },
  { name: "Fri", points: 50 },
  { name: "Sat", points: 90 },
  { name: "Sun", points: 60 },
]

const contentEngagementData = [
  { name: "Music", value: 40 },
  { name: "Videos", value: 30 },
  { name: "Chronicles", value: 20 },
  { name: "Community", value: 10 },
]

const COLORS = ["#D4ED3A", "#00796B", "#004D40", "#B1C62D"]

const upcomingEvents = [
  { title: "Warri Live Show", date: "Dec 25, 2024", venue: "Warri City Stadium", status: "confirmed" },
  { title: "Lagos Concert", date: "Jan 15, 2025", venue: "Eko Hotel", status: "pending" },
]

const recentActivity = [
  { type: "comment", content: "Commented on 'Street Anthem 2024'", time: "2h ago", points: 10 },
  { type: "like", content: "Liked WarriKing23's bars", time: "4h ago", points: 5 },
  { type: "purchase", content: "Bought Paper Boi hoodie", time: "1d ago", points: 50 },
  { type: "exclusive", content: "Watched exclusive studio session", time: "2d ago", points: 25 },
]

export default function DashboardPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Calculate progress percentage
  const nextLevelPoints = profile?.level ? profile.level * 1000 : 1000
  const progressPercentage = profile?.points ? (profile.points / nextLevelPoints) * 100 : 0

  const chartColors = {
    primary: theme === "dark" ? "#FFFFFF" : "#004D40",
    secondary: theme === "dark" ? "#888888" : "#D4ED3A",
    grid: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    text: theme === "dark" ? "#AAAAAA" : "#666666",
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.username || "Fan"}!</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="stat-card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="stat-value">{profile?.points || 0}</p>
              </div>
              <div className="p-2 rounded-full bg-brand-lime/20 dark:bg-harkonnen-dark-gray">
                <Award className="h-5 w-5 text-brand-teal dark:text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">12%</span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Content Watched</p>
                <p className="stat-value">24</p>
              </div>
              <div className="p-2 rounded-full bg-brand-lime/20 dark:bg-harkonnen-dark-gray">
                <Music className="h-5 w-5 text-brand-teal dark:text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">8%</span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Community Posts</p>
                <p className="stat-value">7</p>
              </div>
              <div className="p-2 rounded-full bg-brand-lime/20 dark:bg-harkonnen-dark-gray">
                <MessageSquare className="h-5 w-5 text-brand-teal dark:text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-red-500 font-medium">3%</span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Event Tickets</p>
                <p className="stat-value">2</p>
              </div>
              <div className="p-2 rounded-full bg-brand-lime/20 dark:bg-harkonnen-dark-gray">
                <Ticket className="h-5 w-5 text-brand-teal dark:text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">New</span>
              <span className="text-muted-foreground ml-1">ticket purchased</span>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Chart */}
          <Card className="lg:col-span-2 chart-container">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Weekly Activity</CardTitle>
              <CardDescription>Your point earning activity for the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="name" tick={{ fill: chartColors.text }} />
                    <YAxis tick={{ fill: chartColors.text }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === "dark" ? "#1a1a1a" : "#fff",
                        borderColor: theme === "dark" ? "#333" : "#ddd",
                        color: chartColors.text,
                      }}
                    />
                    <Bar dataKey="points" fill={chartColors.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Content Engagement */}
          <Card className="chart-container">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Content Engagement</CardTitle>
              <CardDescription>How you engage with different content types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contentEngagementData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {contentEngagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === "dark" ? "#1a1a1a" : "#fff",
                        borderColor: theme === "dark" ? "#333" : "#ddd",
                        color: chartColors.text,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Level Progress</CardTitle>
            <CardDescription>
              {profile?.points || 0} / {nextLevelPoints} points to reach Level {(profile?.level || 0) + 1}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="h-2" />
            <div className="mt-2 text-sm text-muted-foreground">
              {nextLevelPoints - (profile?.points || 0)} more points needed for next level
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity and Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div>
                      <p className="text-sm">{activity.content}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <div className="text-sm font-medium text-brand-teal dark:text-white">+{activity.points} pts</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.date} • {event.venue}
                      </p>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded-full ${
                        event.status === "confirmed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                      }`}
                    >
                      {event.status}
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/tickets">View All Events</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
