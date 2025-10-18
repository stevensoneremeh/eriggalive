import { createClient } from "@/lib/supabase/server"
import VideoGrid from "@/components/video-grid"
import VideoHero from "@/components/video-hero"

export default async function Home() {
  const supabase = await createClient()

  const { data: videos, error } = await supabase.from("videos").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching videos:", error)
  }

  const featuredVideo = videos?.[0]
  const otherVideos = videos?.slice(1) || []

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      {featuredVideo && <VideoHero video={featuredVideo} />}

      {/* Videos Grid */}
      <section className="px-4 py-16 md:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            <span className="text-balance">Explore Our Collection</span>
          </h2>
          <p className="mb-12 text-lg text-muted-foreground">Discover stunning videos from around the world</p>
          <VideoGrid videos={otherVideos} />
        </div>
      </section>
    </main>
  )
}
