import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Tag } from "lucide-react"
// Placeholder components for content, will be fleshed out later or with mock data
// import { TrendingPostsList } from "./trending-posts-list"
// import { TopContributorsList } from "./top-contributors-list"
// import { PopularTagsCloud } from "./popular-tags-cloud"

export function RightSidebar() {
  // Mock data or placeholder content for now
  const mockTrendingPosts = [
    { id: 1, title: "Erigga's new freestyle is fire!", votes: 120 },
    { id: 2, title: "My experience at the Lagos concert", votes: 98 },
    { id: 3, title: "Best Erigga punchline ever?", votes: 75 },
  ]

  const mockTopContributors = [
    { id: "user1", username: "PaperBoiFan", points: 1500, avatar_url: "/placeholder-user.jpg" },
    { id: "user2", username: "WarriPikin", points: 1250, avatar_url: "/placeholder-user.jpg" },
    { id: "user3", username: "LyricalDragon", points: 1100, avatar_url: "/placeholder-user.jpg" },
  ]

  const mockTags = ["#EriggaLive", "#Motivation", "#StreetLingo", "#NewMusic", "#Warri"]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Trending Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* <TrendingPostsList /> */}
          <ul className="space-y-2">
            {mockTrendingPosts.map((post) => (
              <li key={post.id} className="text-sm hover:text-primary cursor-pointer">
                {post.title} ({post.votes} votes)
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* <TopContributorsList /> */}
          <ul className="space-y-3">
            {mockTopContributors.map((user) => (
              <li key={user.id} className="flex items-center gap-2 text-sm">
                <img src={user.avatar_url || "/placeholder.svg"} alt={user.username} className="h-8 w-8 rounded-full" />
                <span className="font-medium">{user.username}</span>
                <span className="text-muted-foreground ml-auto">{user.points} pts</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Tag className="mr-2 h-5 w-5 text-primary" />
            Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* <PopularTagsCloud /> */}
          <div className="flex flex-wrap gap-2">
            {mockTags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded hover:bg-primary/20 hover:text-primary cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function RightSidebarSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 w-40 bg-muted rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-8 w-full bg-muted rounded animate-pulse"></div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
