"use client"

import { useState, useEffect } from "react"
import type { Post } from "@/types"
import PostCard from "@/components/post/post-card"
import { useSession } from "next-auth/react"
import supabase from "@/lib/supabase/client"

const CommunityFeed = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const { data: session } = useSession()
  const userId = session?.user?.id

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching posts:", error)
        }

        if (data) {
          setPosts(data)
        }
      } catch (error) {
        console.error("Error during fetch:", error)
      }
    }

    fetchPosts()
  }, [])

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} userId={userId} />
      ))}
    </div>
  )
}

export default CommunityFeed
