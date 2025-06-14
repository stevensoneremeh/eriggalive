"use client"

import { useEffect, useState } from "react"
import { Trophy } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserTierBadge } from "@/components/user-tier-badge"
import { clientDb } from "@/lib/db-operations"

type Contributor = {
  id: number
  username: string
  full_name: string
  avatar_url: string | null
  tier: string
  points: number
  level: number
}

export function UserLeaderboard() {
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContributors() {
      try {
        setLoading(true)
        const { contributors, error } = await clientDb.getTopContributors()

        if (error) throw new Error(error)

        setContributors(contributors)
      } catch (err) {
        console.error("Error fetching contributors:", err)
        setError("Failed to load leaderboard")
      } finally {
        setLoading(false)
      }
    }

    fetchContributors()
  }, [])

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-muted"></div>
            <div className="w-8 h-8 rounded-full bg-muted"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
            <div className="w-12 h-6 rounded bg-muted"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>{error}</p>
      </div>
    )
  }

  if (contributors.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No contributors yet. Be the first!</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {contributors.map((contributor, index) => (
        <div key={contributor.id} className="flex items-center gap-3">
          <div className="w-6 h-6 flex items-center justify-center">
            {index < 3 ? (
              <Trophy
                className={`h-5 w-5 ${
                  index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-700"
                }`}
              />
            ) : (
              <span className="text-muted-foreground font-medium">{index + 1}</span>
            )}
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={contributor.avatar_url || "/placeholder-user.jpg"} alt={contributor.username} />
            <AvatarFallback>{contributor.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{contributor.full_name}</p>
              <UserTierBadge tier={contributor.tier} size="sm" showLabel={false} />
            </div>
            <p className="text-xs text-muted-foreground">
              @{contributor.username} • Level {contributor.level}
            </p>
          </div>
          <div className="text-sm font-medium">{contributor.points} pts</div>
        </div>
      ))}
    </div>
  )
}
