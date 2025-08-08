"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { EnhancedCreatePostForm } from "@/components/community/enhanced-create-post-form"
import { EnhancedPostFeed } from "@/components/community/enhanced-post-feed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, AlertCircle, Crown, Eye, Hash, Heart, MessageSquare, RefreshCw, TrendingUp, Users } from 'lucide-react'
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────
// Type definitions
// ─────────────────────────────────────────────────────────
interface Category {
 id: number
 name: string
 slug: string
 description?: string
 is_active: boolean
}

interface CommunityStats {
 totalMembers: number
 postsToday: number
 activeNow: number
 totalPosts: number
 totalVotes: number
 totalComments: number
}

// ─────────────────────────────────────────────────────────
// Small skeleton while we load data
// ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
 return (
   <div className="space-y-6">
     {Array.from({ length: 3 }).map((_, i) => (
       <Card key={i} className="animate-pulse">
         <CardHeader>
           <div className="flex items-center space-x-3">
             <Skeleton className="w-12 h-12 rounded-full" />
             <div className="space-y-2">
               <Skeleton className="h-4 w-32" />
               <Skeleton className="h-3 w-24" />
             </div>
           </div>
         </CardHeader>
         <CardContent>
           <div className="space-y-3">
             <Skeleton className="h-4 w-full" />
             <Skeleton className="h-4 w-3/4" />
             <Skeleton className="h-48 w-full" />
           </div>
         </CardContent>
       </Card>
     ))}
   </div>
 )
}

// ─────────────────────────────────────────────────────────
// Sidebar w/ fake community stats (replace w/ real API later)
// ─────────────────────────────────────────────────────────
function TrendingSidebar() {
 const [stats, setStats] = useState<CommunityStats>({
   totalMembers: 12_450,
   postsToday: 89,
   activeNow: 234,
   totalPosts: 5_678,
   totalVotes: 23_456,
   totalComments: 8_901,
 })
 const [loading, setLoading] = useState(false)

 const refreshStats = useCallback(async () => {
   setLoading(true)
   try {
     // Simulate network
     await new Promise((res) => setTimeout(res, 1_000))
     setStats((prev) => ({
       ...prev,
       postsToday: prev.postsToday + Math.floor(Math.random() * 5),
       activeNow: prev.activeNow + Math.floor(Math.random() * 10) - 5,
     }))
   } catch (err) {
     console.error("refreshStats error", err)
   } finally {
     setLoading(false)
   }
 }, [])

 return (
   <div className="space-y-6">
     {/* Stats */}
     <Card>
       <CardHeader className="flex items-center justify-between space-y-0 pb-2">
         <CardTitle className="flex items-center text-lg">
           <Activity className="w-5 h-5 mr-2" />
           Community Stats
         </CardTitle>
         <Button variant="ghost" size="sm" onClick={refreshStats} disabled={loading}>
           <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
         </Button>
       </CardHeader>
       <CardContent>
         <div className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div className="text-center p-3 bg-blue-50 rounded-lg">
               <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
               <div className="text-2xl font-bold text-blue-600">{stats.totalMembers.toLocaleString()}</div>
               <p className="text-xs text-blue-600">Members</p>
             </div>
             <div className="text-center p-3 bg-green-50 rounded-lg">
               <MessageSquare className="h-4 w-4 text-green-600 mx-auto mb-1" />
               <div className="text-2xl font-bold text-green-600">{stats.postsToday}</div>
               <p className="text-xs text-green-600">Posts Today</p>
             </div>
           </div>

           <div className="space-y-2">
             {[
               ["Active Now", stats.activeNow],
               ["Total Posts", stats.totalPosts],
               ["Total Votes", stats.totalVotes],
               ["Total Comments", stats.totalComments],
             ].map(([label, value]) => (
               <div key={label as string} className="flex justify-between text-sm text-gray-600">
                 <span>{label}</span>
                 <span className="font-semibold text-gray-900">{Number(value).toLocaleString()}</span>
               </div>
             ))}
           </div>
         </div>
       </CardContent>
     </Card>

     {/* Trending Topics */}
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center text-lg">
           <TrendingUp className="w-5 h-5 mr-2" />
           Trending Topics
         </CardTitle>
       </CardHeader>
       <CardContent>
         <div className="space-y-3">
           {[
             { tag: "#EriggaLive", posts: "10k", trend: "+15%" },
             { tag: "#NewMusic", posts: "8k", trend: "+12%" },
             { tag: "#Community", posts: "6k", trend: "+8%" },
             { tag: "#Bars", posts: "4k", trend: "+5%" },
             { tag: "#Nigeria", posts: "2k", trend: "+3%" },
           ].map((item) => (
             <button
               key={item.tag}
               className="flex w-full items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
             >
               <span className="flex items-center space-x-2">
                 <Hash className="w-4 h-4 text-gray-500" />
                 <span className="font-medium">{item.tag}</span>
               </span>
               <span className="text-right">
                 <span className="text-sm font-medium">{item.posts}</span>
                 <span className="block text-xs text-green-600">{item.trend}</span>
               </span>
             </button>
           ))}
         </div>
       </CardContent>
     </Card>

     {/* Top Contributors */}
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center text-lg">
           <Crown className="w-5 h-5 mr-2" />
           Top Contributors
         </CardTitle>
       </CardHeader>
       <CardContent>
         <div className="space-y-4">
           {[
             { username: "eriggaofficial", votes: 2500, tier: "blood" },
             { username: "warriking", votes: 1800, tier: "pioneer" },
             { username: "naijafan", votes: 1200, tier: "grassroot" },
             { username: "musiclover", votes: 950, tier: "elder" },
             { username: "southsouth", votes: 780, tier: "pioneer" },
           ].map((u, i) => (
             <div key={u.username} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
               <div className="flex items-center space-x-3">
                 <span className="text-sm font-medium w-6 text-gray-500">#{i + 1}</span>
                 <Avatar className="w-8 h-8">
                   <AvatarImage src={"/placeholder-user.jpg"} alt={u.username} />
                   <AvatarFallback>{u.username.charAt(0).toUpperCase()}</AvatarFallback>
                 </Avatar>
                 <div>
                   <p className="font-medium text-sm">{u.username}</p>
                   <span className="text-xs text-gray-500 flex items-center">
                     <Heart className="h-3 w-3 mr-1" />
                     {u.votes} votes
                   </span>
                 </div>
               </div>
               <Badge
                 className={cn(
                   "text-white text-xs",
                   u.tier === "blood"
                     ? "bg-red-500"
                     : u.tier === "pioneer"
                       ? "bg-blue-500"
                       : u.tier === "elder"
                         ? "bg-purple-500"
                         : "bg-green-500",
                 )}
               >
                 {u.tier}
               </Badge>
             </div>
           ))}
         </div>
       </CardContent>
     </Card>

     {/* Quick Actions */}
     <Card>
       <CardHeader>
         <CardTitle className="text-lg">Quick Actions</CardTitle>
       </CardHeader>
       <CardContent>
         {[
           { icon: Hash, label: "Browse Topics" },
           { icon: Users, label: "Find Users" },
           { icon: Eye, label: "View Guidelines" },
         ].map(({ icon: Icon, label }) => (
           <Button
             key={label}
             variant="outline"
             className="w-full justify-start mb-2 last:mb-0 bg-transparent"
             size="sm"
           >
             <Icon className="h-4 w-4 mr-2" />
             {label}
           </Button>
         ))}
       </CardContent>
     </Card>
   </div>
 )
}

// ─────────────────────────────────────────────────────────
// Main client page
// ─────────────────────────────────────────────────────────
export function CommunityPageClient() {
 const supabase = createClient()
 const [categories, setCategories] = useState<Category[]>([])
 const [posts, setPosts] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 // Fetch active categories once on mount
 useEffect(() => {
   async function loadCategories() {
     try {
       const { data, error: fetchErr } = await supabase
         .from("community_categories")
         .select("*")
         .eq("is_active", true)
         .order("display_order", { ascending: true })

       if (fetchErr) throw fetchErr
       setCategories(data ?? [])
     } catch (e) {
       console.error("loadCategories", e)
       setError("Could not load categories. Showing defaults.")
       // simple fallback set
       setCategories([
         { id: 1, name: "General Discussion", slug: "general", is_active: true },
         { id: 2, name: "Music & Lyrics", slug: "music", is_active: true },
       ] as any)
     } finally {
       setLoading(false)
     }
   }

   loadCategories()
 }, [supabase])

 // When a post is created from the form
 const handlePostCreated = useCallback((newPost: any) => {
   setPosts((prev) => [newPost, ...prev])
   toast.success("Post created successfully! 🎉")
 }, [])

 if (loading) {
   return (
     <div className="min-h-screen bg-gray-50">
       <div className="container mx-auto px-4 py-8">
         <LoadingSkeleton />
       </div>
     </div>
   )
 }

 return (
   <main className="min-h-screen bg-gray-50">
     <div className="container mx-auto px-4 py-8">
       {/* Header */}
       <header className="mb-8">
         <h1 className="text-4xl font-bold mb-2">Community</h1>
         <p className="text-lg text-gray-600 max-w-2xl">
           Connect with fellow Erigga fans, share your passion for music, and join the conversation!
         </p>
       </header>

       {error && (
         <Alert className="mb-6">
           <AlertCircle className="h-4 w-4" />
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Posts + create form */}
         <section className="lg:col-span-3 space-y-8">
           <EnhancedCreatePostForm categories={categories} onPostCreated={handlePostCreated} />
           <Suspense fallback={<LoadingSkeleton />}>
             <EnhancedPostFeed
               categories={categories}
               initialPosts={posts}
               /** extra prop in case component expects `posts` */
               posts={posts}
             />
           </Suspense>
         </section>

         {/* Right sidebar (hidden on mobile) */}
         <aside className="hidden lg:block sticky top-24 space-y-8">
           <TrendingSidebar />
         </aside>
       </div>

       {/* Mobile sidebar */}
       <div className="lg:hidden mt-8">
         <TrendingSidebar />
       </div>
     </div>
   </main>
 )
}
