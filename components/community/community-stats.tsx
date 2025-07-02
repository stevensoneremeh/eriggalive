"use client"

import type React from "react"
import { useEffect, useState } from "react"
// Update the import for the Supabase client
import supabase from "@/lib/supabase/client"

interface CommunityStatsProps {
  communityId: string
}

const CommunityStats: React.FC<CommunityStatsProps> = ({ communityId }) => {
  const [memberCount, setMemberCount] = useState<number>(0)
  const [postCount, setPostCount] = useState<number>(0)

  useEffect(() => {
    const fetchCommunityStats = async () => {
      try {
        // Fetch member count
        const { data: members, error: membersError } = await supabase
          .from("community_members")
          .select("*", { count: "exact" })
          .eq("community_id", communityId)

        if (membersError) {
          console.error("Error fetching member count:", membersError)
        } else {
          setMemberCount(members ? members.length : 0)
        }

        // Fetch post count
        const { data: posts, error: postsError } = await supabase
          .from("posts")
          .select("*", { count: "exact" })
          .eq("community_id", communityId)

        if (postsError) {
          console.error("Error fetching post count:", postsError)
        } else {
          setPostCount(posts ? posts.length : 0)
        }
      } catch (error) {
        console.error("Error fetching community stats:", error)
      }
    }

    fetchCommunityStats()
  }, [communityId])

  return (
    <div>
      <p>Members: {memberCount}</p>
      <p>Posts: {postCount}</p>
    </div>
  )
}

export default CommunityStats
