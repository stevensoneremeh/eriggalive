import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Heart, MessageCircle, Share2 } from "lucide-react"
import Image from "next/image"

const chronicles = [
  {
    id: 1,
    title: "The Making of 'Street Symphony'",
    excerpt:
      "Go behind the scenes of Erigga's latest masterpiece and discover the creative process that brought this album to life.",
    content:
      "In this exclusive chronicle, we take you deep into the studio sessions that created 'Street Symphony'. From the initial concept to the final mix, witness the dedication and artistry that goes into every Erigga track...",
    author: "Erigga",
    date: "2024-01-15",
    readTime: "8 min read",
    category: "Studio Sessions",
    likes: 234,
    comments: 45,
    image: "/placeholder.svg?height=400&width=600&text=Studio+Session",
  },
  {
    id: 2,
    title: "From the Streets to the Stage",
    excerpt: "The journey of a street anthem from conception to becoming a crowd favorite at live performances.",
    content:
      "Every song has a story, and this one begins on the streets of Warri. Learn how real-life experiences shape the music and connect with fans on a deeper level...",
    author: "Erigga",
    date: "2024-01-10",
    readTime: "6 min read",
    category: "Life Stories",
    likes: 189,
    comments: 32,
    image: "/placeholder.svg?height=400&width=600&text=Street+Performance",
  },
  {
    id: 3,
    title: "Collaborations and Connections",
    excerpt: "Exploring the relationships and collaborations that have shaped Erigga's musical journey.",
    content:
      "Music is about connections. Discover the stories behind some of the most memorable collaborations and the artists who have influenced the sound...",
    author: "Erigga",
    date: "2024-01-05",
    readTime: "10 min read",
    category: "Collaborations",
    likes: 156,
    comments: 28,
    image: "/placeholder.svg?height=400&width=600&text=Collaboration",
  },
  {
    id: 4,
    title: "The Evolution of Sound",
    excerpt: "How Erigga's musical style has evolved over the years while staying true to the streets.",
    content:
      "From the early days to now, trace the evolution of a unique sound that bridges street credibility with mainstream appeal...",
    author: "Erigga",
    date: "2023-12-28",
    readTime: "7 min read",
    category: "Musical Journey",
    likes: 201,
    comments: 38,
    image: "/placeholder.svg?height=400&width=600&text=Musical+Evolution",
  },
]

export default function ChroniclesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Erigga <span className="text-orange-500">Chronicles</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Dive deep into the stories, experiences, and creative process behind the music. Get exclusive insights
          straight from the artist.
        </p>
      </div>

      {/* Featured Chronicle */}
      <Card className="mb-12 overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            <Image
              src={chronicles[0].image || "/placeholder.svg"}
              alt={chronicles[0].title}
              width={600}
              height={400}
              className="w-full h-64 md:h-full object-cover"
            />
          </div>
          <div className="md:w-1/2 p-8">
            <Badge className="mb-4">{chronicles[0].category}</Badge>
            <h2 className="text-3xl font-bold mb-4">{chronicles[0].title}</h2>
            <p className="text-muted-foreground mb-6">{chronicles[0].excerpt}</p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {chronicles[0].author}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(chronicles[0].date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {chronicles[0].readTime}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button size="lg">Read Full Story</Button>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {chronicles[0].likes}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {chronicles[0].comments}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Chronicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {chronicles.slice(1).map((chronicle) => (
          <Card key={chronicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video relative">
              <Image src={chronicle.image || "/placeholder.svg"} alt={chronicle.title} fill className="object-cover" />
              <Badge className="absolute top-4 left-4">{chronicle.category}</Badge>
            </div>

            <CardHeader>
              <CardTitle className="line-clamp-2">{chronicle.title}</CardTitle>
              <CardDescription className="line-clamp-3">{chronicle.excerpt}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {chronicle.author}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {chronicle.readTime}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm">
                  Read More
                </Button>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <Heart className="h-4 w-4" />
                    {chronicle.likes}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <MessageCircle className="h-4 w-4" />
                    {chronicle.comments}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center mt-12">
        <Button variant="outline" size="lg">
          Load More Chronicles
        </Button>
      </div>
    </div>
  )
}
