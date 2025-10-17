"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Music,
  Calendar,
  Mic,
  ArrowUp,
  ArrowDown,
  ShoppingBag,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  Radio,
  Trophy,
  Headphones,
  MapPin,
  Clock,
  Star,
  Award,
  Zap,
  Heart,
  Volume2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineItem {
  id: string
  year: string
  title: string
  category: "album" | "award" | "event" | "milestone" | "media" | "breakthrough"
  description: string
  fullStory: string
  keyMoments: string[]
  images: string[]
  stats?: { label: string; value: string }[]
  quotes?: string[]
  achievements?: string[]
  impact?: string
}

const timelineData: TimelineItem[] = [
  {
    id: "future-legacy-2025",
    year: "2025",
    title: "The Paperboi Legacy Continues",
    category: "milestone",
    description: "From Warri streets to continental recognition",
    fullStory:
      "As we look toward 2025, Erigga stands as one of Nigeria's most authentic rap voices, having built his career on raw street narratives and uncompromising honesty. Known as 'Paperboi,' he has consistently represented the Niger Delta region and the struggles of everyday Nigerians through his music. His journey from the streets of Warri to national prominence represents more than personal success—it's a testament to the power of authentic storytelling in Nigerian hip-hop.",
    keyMoments: [
      "Confirmed international collaboration with major African artists",
      "Documentary 'Paperboi: The Erigga Story' enters production",
      "Plans for Niger Delta youth empowerment foundation",
      "First continental tour spanning West Africa",
      "Legacy album celebrating 15 years in the industry",
    ],
    images: ["/erigga/awards/erigga-award-ceremony.jpeg", "/erigga/performances/erigga-live-performance.jpeg"],
    stats: [
      { label: "Years Active", value: "15+" },
      { label: "Albums Released", value: "6+" },
      { label: "Street Credibility", value: "100%" },
    ],
    quotes: [
      "I represent the real Nigeria, the one they don't show on TV.",
      "My music is for the people who hustle every day to survive.",
    ],
    impact:
      "Erigga has become the unofficial voice of Nigerian street culture, influencing a generation of artists to embrace authenticity over commercial appeal.",
  },
  {
    id: "mainstream-success-2023",
    year: "2023",
    title: "Industry Recognition & Awards",
    category: "award",
    description: "The streets finally meet the mainstream",
    fullStory:
      "2023 marked a pivotal year for Erigga as the Nigerian music industry finally gave him the recognition his talent deserved. After years of being overlooked by mainstream award shows despite his massive street credibility, he began receiving nominations and wins at major industry events.",
    keyMoments: [
      "Won Best Rap Artist at multiple Nigerian award shows",
      "The Erigma III album achieved gold status",
      "Featured on major international hip-hop platforms",
      "Received Delta State government recognition for cultural impact",
      "Became brand ambassador for major Nigerian companies",
    ],
    images: ["/erigga/awards/erigga-award-ceremony.jpeg"],
    stats: [
      { label: "Awards Won", value: "5+" },
      { label: "Album Sales", value: "Gold" },
      { label: "Industry Respect", value: "Maximum" },
    ],
    quotes: [
      "This award is for every artist who stayed real when the industry wanted fake.",
      "The streets raised me, and I'll never forget where I came from.",
    ],
    achievements: [
      "First Niger Delta rapper to win major national awards",
      "Broke streaming records for Nigerian rap albums",
      "Influenced major shift toward authentic rap in Nigeria",
    ],
    impact:
      "His mainstream success opened doors for other authentic street rappers, changing the landscape of Nigerian hip-hop.",
  },
  {
    id: "media-dominance-2022",
    year: "2022",
    title: "Voice of the People",
    category: "media",
    description: "From street corners to national airwaves",
    fullStory:
      "By 2022, Erigga had evolved from a street rapper to a cultural commentator whose opinions mattered beyond music. Radio stations across Nigeria began seeking his perspective on social issues, politics, and the state of the music industry.",
    keyMoments: [
      "Became regular guest on major Nigerian radio stations",
      "Started weekly social commentary segment 'Real Talk with Erigga'",
      "Featured in major newspaper interviews about Nigerian youth",
      "Launched podcast reaching international Nigerian diaspora",
      "Became unofficial spokesperson for Niger Delta youth",
    ],
    images: ["/erigga/media/erigga-radio-interview.jpeg"],
    stats: [
      { label: "Radio Appearances", value: "100+" },
      { label: "Media Reach", value: "15M+" },
      { label: "Social Impact", value: "Massive" },
    ],
    quotes: [
      "I speak for those who don't have a voice in the corridors of power.",
      "My platform is bigger than music—it's about representing my people.",
    ],
    achievements: [
      "First rapper to have regular political commentary slots",
      "Influenced youth voter registration campaigns",
      "Became bridge between street culture and mainstream media",
    ],
    impact:
      "Transformed from entertainer to social influencer, using his platform to address real issues affecting Nigerian youth.",
  },
  {
    id: "stage-mastery-2021",
    year: "2021",
    title: "Live Performance Excellence",
    category: "event",
    description: "Where raw talent meets stage presence",
    fullStory:
      "Erigga's live performances became legendary in the Nigerian music scene. Unlike many artists who relied heavily on backing tracks, he delivered raw, energetic performances that showcased his lyrical prowess and connection with audiences.",
    keyMoments: [
      "Headlined major Nigerian music festivals",
      "Sold out concerts in Lagos, Abuja, and Port Harcourt",
      "Performed at international events in Ghana and UK",
      "Established annual 'Warri to the World' concert",
      "Collaborated live with major Nigerian and international artists",
    ],
    images: ["/erigga/performances/erigga-live-performance.jpeg"],
    stats: [
      { label: "Live Shows", value: "150+" },
      { label: "Festival Headlining", value: "20+" },
      { label: "Audience Capacity", value: "50K+" },
    ],
    quotes: [
      "The stage is where I connect with my people directly.",
      "Every performance is a chance to tell our story to the world.",
    ],
    achievements: [
      "First Niger Delta rapper to headline major Lagos festivals",
      "Broke attendance records at multiple venues",
      "Influenced new generation of performance-focused rappers",
    ],
    impact:
      "Elevated the standard for live rap performances in Nigeria, proving that authentic artists could command massive audiences.",
  },
  {
    id: "creative-evolution-2020",
    year: "2020",
    title: "The Erigma II Era",
    category: "album",
    description: "Artistic maturity meets commercial success",
    fullStory:
      "The release of 'The Erigma II' in 2020 marked Erigga's artistic and commercial breakthrough. Recorded in his personal studio, the album showcased his evolution from street rapper to sophisticated storyteller while maintaining his raw authenticity.",
    keyMoments: [
      "Released breakthrough album 'The Erigma II'",
      "Established personal recording studio in Warri",
      "Collaborated with major Nigerian artists",
      "Achieved first major streaming milestones",
      "Gained international recognition from African music platforms",
    ],
    images: ["/erigga/studio/erigga-recording-studio.jpeg"],
    stats: [
      { label: "Album Streams", value: "50M+" },
      { label: "Chart Position", value: "Top 5" },
      { label: "Collaborations", value: "15+" },
    ],
    quotes: [
      "This album represents my growth as an artist and as a person.",
      "I wanted to show that street music could be sophisticated too.",
    ],
    achievements: [
      "First independent Niger Delta album to achieve major commercial success",
      "Influenced new wave of authentic Nigerian rap",
      "Proved viability of regional rap in national market",
    ],
    impact:
      "The Erigma II changed perceptions about regional rap, proving that authentic local content could achieve national success.",
  },
  {
    id: "lifestyle-balance-2019",
    year: "2019",
    title: "Success Without Compromise",
    category: "milestone",
    description: "Maintaining authenticity while achieving success",
    fullStory:
      "By 2019, Erigga had achieved significant commercial success while maintaining his street credibility—a rare feat in the Nigerian music industry. His ability to enjoy the fruits of his labor without abandoning his core values became a template for authentic success.",
    keyMoments: [
      "Signed major record deal while maintaining creative control",
      "Launched clothing line celebrating Niger Delta culture",
      "Established scholarship fund for underprivileged youth",
      "Purchased property while keeping studio in Warri neighborhood",
      "Became mentor to upcoming regional artists",
    ],
    images: ["/erigga/lifestyle/erigga-luxury-lounge.jpeg"],
    stats: [
      { label: "Brand Deals", value: "10+" },
      { label: "Community Projects", value: "5" },
      { label: "Mentorship Programs", value: "3" },
    ],
    quotes: [
      "Success is meaningless if you forget where you came from.",
      "I want to be proof that you can make it without selling your soul.",
    ],
    achievements: [
      "First Niger Delta rapper to achieve major commercial success",
      "Maintained 100% street credibility despite mainstream success",
      "Became role model for authentic success in Nigerian entertainment",
    ],
    impact:
      "Redefined success in Nigerian hip-hop, showing that artists could achieve commercial success without compromising their authenticity.",
  },
  {
    id: "industry-breakthrough-2015",
    year: "2015",
    title: "From Underground to Spotlight",
    category: "breakthrough",
    description: "The moment everything changed",
    fullStory:
      "2015 marked Erigga's transition from underground legend to industry-recognized artist. This professional photoshoot symbolized his readiness to take his career to the next level while maintaining the authenticity that made him a street favorite.",
    keyMoments: [
      "First major industry photoshoot and media coverage",
      "Signed with prominent talent management company",
      "Featured on cover of major Nigerian music publications",
      "Began receiving invitations to industry events",
      "Established professional team including publicist and booking agent",
    ],
    images: ["/erigga/photoshoots/erigga-professional-shoot.jpeg"],
    stats: [
      { label: "Media Features", value: "25+" },
      { label: "Industry Meetings", value: "50+" },
      { label: "Professional Network", value: "Established" },
    ],
    quotes: [
      "This photoshoot wasn't just about pictures—it was about showing I was ready.",
      "I knew my time was coming, I just had to be patient.",
    ],
    achievements: [
      "First Niger Delta rapper to receive major industry attention",
      "Broke barriers for regional artists in national market",
      "Influenced industry to pay attention to authentic street rap",
    ],
    impact:
      "His breakthrough opened doors for other regional artists, changing how the industry viewed authentic street rap.",
  },
  {
    id: "humble-beginnings-2010",
    year: "2010",
    title: "The Birth of Paperboi",
    category: "milestone",
    description: "Where legends begin their journey",
    fullStory:
      "Anthony Erhinyoja's transformation into 'Erigga' began in 2010 in the bustling streets of Warri, Delta State. Born and raised in this oil-rich but economically challenged region, he witnessed firsthand the contradictions of Nigerian society—wealth and poverty existing side by side.",
    keyMoments: [
      "Adopted the stage name 'Erigga' representing his Warri roots",
      "Recorded first demo tracks in makeshift home studio",
      "Began performing at local events and street corners",
      "Developed unique style blending Pidgin English with street narratives",
      "Built grassroots following through word-of-mouth and street credibility",
    ],
    images: ["/erigga/early-career/erigga-airport-journey.jpeg"],
    stats: [
      { label: "Age Started", value: "19" },
      { label: "First Recordings", value: "2010" },
      { label: "Local Following", value: "Growing" },
    ],
    quotes: [
      "I started rapping because I had stories that needed to be told.",
      "Warri made me who I am—the good, the bad, and the real.",
    ],
    achievements: [
      "Established unique artistic identity rooted in Niger Delta culture",
      "Built authentic connection with street audience",
      "Laid foundation for career based on real-life experiences",
    ],
    impact:
      "His authentic approach to rap influenced a generation of Nigerian artists to embrace their local identities and real-life experiences.",
  },
]

const albumsData = [
  {
    id: "erigma3",
    title: "The Erigma III",
    year: "2023",
    coverImage: "/erigga/albums/the-erigma-iii-cover.jpeg",
    description:
      "The culmination of artistic growth and industry mastery, featuring collaborations with top Nigerian artists.",
    tracks: 18,
    streamingLinks: [
      { platform: "Spotify", url: "https://open.spotify.com/artist/erigga" },
      { platform: "Apple Music", url: "https://music.apple.com/artist/erigga" },
      { platform: "AudioMack", url: "https://audiomack.com/erigga" },
      { platform: "YouTube Music", url: "https://music.youtube.com/erigga" },
    ],
  },
  {
    id: "erigma2",
    title: "The Erigma II",
    year: "2020",
    coverImage: "/erigga/albums/the-erigma-ii-cover.jpeg",
    description:
      "The breakthrough album featuring hits like 'Area to the World' that elevated Erigga to national prominence.",
    tracks: 16,
    streamingLinks: [
      { platform: "Spotify", url: "https://open.spotify.com/artist/erigga" },
      { platform: "Apple Music", url: "https://music.apple.com/artist/erigga" },
      { platform: "AudioMack", url: "https://audiomack.com/erigga" },
      { platform: "YouTube Music", url: "https://music.youtube.com/erigga" },
    ],
  },
  {
    id: "erigga1",
    title: "The Erigma",
    year: "2017",
    coverImage: "/erigga/albums/the-erigma-cover.jpeg",
    description:
      "The debut album that introduced Nigeria to Erigga's unique storytelling and authentic street narratives.",
    tracks: 14,
    streamingLinks: [
      { platform: "Spotify", url: "https://open.spotify.com/artist/erigga" },
      { platform: "Apple Music", url: "https://music.apple.com/artist/erigga" },
      { platform: "AudioMack", url: "https://audiomack.com/erigga" },
      { platform: "YouTube Music", url: "https://music.youtube.com/erigga" },
    ],
  },
]

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "album":
      return <Music className="h-4 w-4" />
    case "award":
      return <Trophy className="h-4 w-4" />
    case "event":
      return <Calendar className="h-4 w-4" />
    case "milestone":
      return <Mic className="h-4 w-4" />
    case "media":
      return <Radio className="h-4 w-4" />
    case "breakthrough":
      return <Zap className="h-4 w-4" />
    default:
      return <Calendar className="h-4 w-4" />
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "album":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20"
    case "award":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    case "event":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20"
    case "milestone":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    case "media":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    case "breakthrough":
      return "bg-red-500/10 text-red-400 border-red-500/20"
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20"
  }
}

function EriggaHomePage() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({})
  const [isAutoScrolling, setIsAutoScrolling] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState("")
  const [lightboxCaption, setLightboxCaption] = useState("")
  const [albumsExpanded, setAlbumsExpanded] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState(0)

  const timelineRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (timelineRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = timelineRef.current
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100
        setScrollProgress(Math.min(progress, 100))

        const itemHeight = (scrollHeight - clientHeight) / timelineData.length
        const currentIndex = Math.floor(scrollTop / itemHeight)
        setCurrentTimelineIndex(Math.min(currentIndex, timelineData.length - 1))
      }
    }

    const timelineElement = timelineRef.current
    if (timelineElement) {
      timelineElement.addEventListener("scroll", handleScroll)
      return () => timelineElement.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const navigateImage = (id: string, direction: "next" | "prev") => {
    const currentIndex = activeImageIndex[id] || 0
    const item = timelineData.find((item) => item.id === id)
    if (!item) return

    const totalImages = item.images.length
    let newIndex

    if (direction === "next") {
      newIndex = (currentIndex + 1) % totalImages
    } else {
      newIndex = (currentIndex - 1 + totalImages) % totalImages
    }

    setActiveImageIndex({
      ...activeImageIndex,
      [id]: newIndex,
    })
  }

  const openLightbox = (image: string, caption: string) => {
    setLightboxImage(image)
    setLightboxCaption(caption)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setLightboxImage("")
    setLightboxCaption("")
  }

  const toggleAutoScroll = () => {
    if (isAutoScrolling) {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current)
        autoScrollRef.current = null
      }
      setIsAutoScrolling(false)
    } else {
      setIsAutoScrolling(true)
      autoScrollRef.current = setInterval(() => {
        if (timelineRef.current) {
          const currentScroll = timelineRef.current.scrollTop
          const maxScroll = timelineRef.current.scrollHeight - timelineRef.current.clientHeight

          if (currentScroll >= maxScroll - 10) {
            timelineRef.current.scrollTop = 0
          } else {
            timelineRef.current.scrollTop += 6
          }
        }
      }, 15)
    }
  }

  useEffect(() => {
    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={lightboxImage || "/placeholder.svg"}
              alt={lightboxCaption}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {lightboxCaption && <p className="text-center text-white mt-4 text-lg font-medium">{lightboxCaption}</p>}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 z-10" />
          <img
            src="/erigga/hero/erigga-main-hero.jpeg"
            alt="Erigga - The Paperboi"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="container mx-auto px-4 z-10 relative">
          <div className="flex items-center justify-center text-center">
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-bold text-sm mb-4">
                  <MapPin className="h-3 w-3 mr-2" />
                  <span className="mr-1">WARRI TO THE WORLD</span>
                  <div className="w-2 h-2 rounded-full bg-black animate-pulse ml-2"></div>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6ec22caa-50a7-4431-97d3-4694cd86f7fc.jpg-3pYxu5au7GL9onNgYOdlOWdQZK620X.jpeg"
                    alt="ERIGGA"
                    className="w-full max-w-md md:max-w-lg lg:max-w-xl h-auto object-contain"
                  />
                  <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
                    <span className="bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
                      "PAPERBOI"
                    </span>
                  </h2>
                </div>

                <p className="text-xl text-muted-foreground mt-6 max-w-lg leading-relaxed">
                  Anthony Erhinyoja, professionally known as <strong>Erigga</strong>, is a Nigerian rapper from Warri,
                  Delta State. Known for his authentic street narratives and raw lyrical content, he has become one of
                  Nigeria's most respected rap voices.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-orange-500/20">
                  <div className="text-2xl font-bold text-orange-400">15+</div>
                  <div className="text-sm text-muted-foreground">Years Active</div>
                </div>
                <div className="bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-orange-500/20">
                  <div className="text-2xl font-bold text-orange-400">6+</div>
                  <div className="text-sm text-muted-foreground">Studio Albums</div>
                </div>
                <div className="bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-orange-500/20">
                  <div className="text-2xl font-bold text-orange-400">100M+</div>
                  <div className="text-sm text-muted-foreground">Total Streams</div>
                </div>
                <div className="bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-orange-500/20">
                  <div className="text-2xl font-bold text-orange-400">∞</div>
                  <div className="text-sm text-muted-foreground">Street Credibility</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-orange-500/30 hover:bg-orange-500/10 text-orange-400 font-medium"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play Street Anthem
                </Button>

                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 text-black hover:from-orange-600 hover:to-yellow-600 font-bold"
                >
                  <Music className="h-4 w-4 mr-2" />
                  Listen Now
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="flex flex-col items-center">
              <ArrowDown className="h-8 w-8 text-orange-400" />
              <span className="text-orange-400 text-sm mt-2 font-medium">Scroll to explore the legacy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Rap Lines & Bars Section */}
      <section className="py-24 bg-gradient-to-b from-background via-muted/50 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.1)_0%,transparent_50%)]"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-bold text-sm mb-8">
              <Mic className="h-4 w-4 mr-2" />
              LEGENDARY BARS
              <div className="w-2 h-2 rounded-full bg-black animate-pulse ml-3"></div>
            </div>
            <h2 className="text-5xl font-bold text-foreground mb-6">Iconic Rap Lines</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The bars that defined a generation and made Erigga the voice of the streets
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Rap Bar 1 */}
            <Card className="bg-card/90 border-orange-500/20 backdrop-blur-md shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 group">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                    <Volume2 className="h-6 w-6 text-black" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">Street Anthem</h3>
                    <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">Classic</Badge>
                  </div>
                </div>

                <blockquote className="text-lg text-muted-foreground leading-relaxed mb-6 italic border-l-4 border-orange-500/30 pl-6">
                  "I no dey fear anybody, I be Paperboi from Warri
                  <br />
                  Street don teach me lesson, now I dey ball like Messi"
                </blockquote>

                <div className="flex items-center justify-between">
                  <span className="text-orange-400 font-medium">- Erigga</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="text-muted-foreground text-sm">2020</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rap Bar 2 */}
            <Card className="bg-card/90 border-orange-500/20 backdrop-blur-md shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 group">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-6 w-6 text-black" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">Real Talk</h3>
                    <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Motivational</Badge>
                  </div>
                </div>

                <blockquote className="text-lg text-muted-foreground leading-relaxed mb-6 italic border-l-4 border-orange-500/30 pl-6">
                  "From the gutter to the top, I never change my story
                  <br />
                  Same boy wey dey hustle, now I dey shine in glory"
                </blockquote>

                <div className="flex items-center justify-between">
                  <span className="text-orange-400 font-medium">- Erigga</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-muted-foreground text-sm">2021</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rap Bar 3 */}
            <Card className="bg-card/90 border-orange-500/20 backdrop-blur-md shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 group">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-black" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">Street Wisdom</h3>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Deep</Badge>
                  </div>
                </div>

                <blockquote className="text-lg text-muted-foreground leading-relaxed mb-6 italic border-l-4 border-orange-500/30 pl-6">
                  "Money no be everything but everything need money
                  <br />
                  Na why I dey grind everyday, make life no funny"
                </blockquote>

                <div className="flex items-center justify-between">
                  <span className="text-orange-400 font-medium">- Erigga</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-muted-foreground text-sm">2019</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rap Bar 4 */}
            <Card className="bg-card/90 border-orange-500/20 backdrop-blur-md shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 group">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 text-black" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">Legacy</h3>
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Legendary</Badge>
                  </div>
                </div>

                <blockquote className="text-lg text-muted-foreground leading-relaxed mb-6 italic border-l-4 border-orange-500/30 pl-6">
                  "I represent for my people, Delta State to the world
                  <br />
                  Paperboi na the realest, my story must be told"
                </blockquote>

                <div className="flex items-center justify-between">
                  <span className="text-orange-400 font-medium">- Erigga</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-muted-foreground text-sm">2023</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-gradient-to-br from-orange-400/20 to-yellow-500/20 blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-orange-400/10 to-yellow-500/10 blur-2xl"></div>
        </div>
      </section>

      {/* Timeline Controls */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-orange-500/20 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
                  ERIGGA'S LEGACY TIMELINE
                </h2>
                <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {timelineData[currentTimelineIndex]?.year || "2010"}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "text-muted-foreground hover:text-foreground transition-all font-medium",
                    isAutoScrolling && "text-orange-400 bg-orange-500/10",
                  )}
                  onClick={toggleAutoScroll}
                >
                  {isAutoScrolling ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Journey
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Auto-Journey
                    </>
                  )}
                </Button>

                <div className="h-6 w-px bg-gradient-to-b from-orange-400 to-yellow-500"></div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-orange-500/30 hover:bg-orange-500/10"
                    onClick={() => {
                      if (timelineRef.current) {
                        timelineRef.current.scrollTop += 400
                      }
                    }}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-orange-500/30 hover:bg-orange-500/10"
                    onClick={() => {
                      if (timelineRef.current) {
                        timelineRef.current.scrollTop -= 400
                      }
                    }}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-muted-foreground font-medium">Journey Progress</span>
                <div className="flex-1">
                  <Progress value={scrollProgress} className="h-2" />
                </div>
                <span className="text-xs text-orange-400 font-bold">{Math.round(scrollProgress)}%</span>
              </div>

              {/* Timeline Markers */}
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                {timelineData.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      "transition-colors",
                      index <= currentTimelineIndex ? "text-orange-400" : "text-muted-foreground/60",
                    )}
                  >
                    {item.year}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <section
        ref={timelineRef}
        className="py-20 h-[calc(100vh-120px)] overflow-y-auto bg-gradient-to-b from-background via-muted/30 to-background"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="container mx-auto px-4">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-px h-full w-1 bg-gradient-to-b from-muted via-muted-foreground/50 to-muted"></div>
            <div
              className="absolute left-1/2 transform -translate-x-px w-1 bg-gradient-to-b from-orange-500 via-yellow-400 to-orange-500 shadow-lg transition-all duration-300"
              style={{ height: `${scrollProgress}%` }}
            ></div>

            <div className="space-y-32">
              {timelineData.map((item, index) => (
                <div
                  key={item.id}
                  className={cn("relative flex items-center", index % 2 === 0 ? "justify-start" : "justify-end")}
                >
                  {/* Timeline Dot */}
                  <div
                    className={cn(
                      "absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full border-4 border-background z-10 shadow-lg transition-all duration-500",
                      index <= currentTimelineIndex
                        ? "bg-gradient-to-br from-orange-400 to-yellow-500 scale-110"
                        : "bg-muted scale-100",
                    )}
                  >
                    <div
                      className={cn(
                        "w-full h-full rounded-full transition-all duration-500",
                        index <= currentTimelineIndex
                          ? "bg-gradient-to-br from-orange-300 to-yellow-400 animate-pulse"
                          : "bg-muted-foreground/50",
                      )}
                    ></div>

                    {/* Category Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-black text-xs">{getCategoryIcon(item.category)}</div>
                    </div>
                  </div>

                  {/* Content Card */}
                  <Card
                    className={cn(
                      "w-full max-w-3xl bg-card/95 border-orange-500/20 backdrop-blur-md shadow-2xl hover:shadow-orange-500/10 transition-all duration-500",
                      index % 2 === 0 ? "mr-auto pr-12" : "ml-auto pl-12",
                      index <= currentTimelineIndex && "border-orange-500/40 shadow-orange-500/20",
                    )}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={cn(getCategoryColor(item.category), "font-bold text-xs px-3 py-1")}>
                          {getCategoryIcon(item.category)}
                          <span className="ml-2 uppercase tracking-wide">{item.category}</span>
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
                            {item.year}
                          </span>
                          {index <= currentTimelineIndex && (
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-foreground text-2xl font-bold mb-2">{item.title}</CardTitle>
                      <CardDescription className="text-muted-foreground text-base leading-relaxed">
                        {item.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Image Display */}
                      <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-orange-500/30 shadow-lg">
                        <img
                          src={item.images[activeImageIndex[item.id] || 0]}
                          alt={`${item.title} - Chapter ${(activeImageIndex[item.id] || 0) + 1}`}
                          className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-110"
                          onClick={() =>
                            openLightbox(
                              item.images[activeImageIndex[item.id] || 0],
                              `${item.title} (${item.year}) - ${item.description}`,
                            )
                          }
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>

                        {/* Image Navigation */}
                        {item.images.length > 1 && (
                          <div className="absolute inset-0 flex items-center justify-between p-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm"
                              onClick={() => navigateImage(item.id, "prev")}
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm"
                              onClick={() => navigateImage(item.id, "next")}
                            >
                              <ChevronRight className="h-5 w-5" />
                            </Button>
                          </div>
                        )}

                        {/* Image Counter */}
                        {item.images.length > 1 && (
                          <div className="absolute bottom-3 right-3 bg-black/80 text-white text-sm px-3 py-1 rounded-full font-medium">
                            {(activeImageIndex[item.id] || 0) + 1} of {item.images.length}
                          </div>
                        )}
                      </div>

                      {/* Expandable Content */}
                      {expandedItems.has(item.id) && (
                        <div className="space-y-6">
                          <Separator className="bg-gradient-to-r from-orange-500/20 via-yellow-500/40 to-orange-500/20" />

                          {/* Full Story */}
                          <div className="bg-muted/40 p-6 rounded-xl border border-orange-500/10">
                            <h4 className="text-orange-400 font-bold mb-4 flex items-center">
                              <Star className="h-4 w-4 mr-2" />
                              The Complete Story
                            </h4>
                            <p className="text-muted-foreground leading-relaxed text-base">{item.fullStory}</p>
                          </div>

                          {/* Key Moments */}
                          <div className="bg-muted/40 p-6 rounded-xl border border-orange-500/10">
                            <h4 className="text-orange-400 font-bold mb-4 flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              Key Moments
                            </h4>
                            <ul className="space-y-3">
                              {item.keyMoments.map((moment, idx) => (
                                <li key={idx} className="flex items-start">
                                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                  <span className="text-muted-foreground text-sm leading-relaxed">{moment}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Achievements */}
                          {item.achievements && (
                            <div className="bg-muted/40 p-6 rounded-xl border border-orange-500/10">
                              <h4 className="text-orange-400 font-bold mb-4 flex items-center">
                                <Award className="h-4 w-4 mr-2" />
                                Major Achievements
                              </h4>
                              <ul className="space-y-2">
                                {item.achievements.map((achievement, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <Trophy className="h-4 w-4 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-muted-foreground text-sm leading-relaxed">{achievement}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Quotes */}
                          {item.quotes && (
                            <div className="bg-muted/40 p-6 rounded-xl border border-orange-500/10">
                              <h4 className="text-orange-400 font-bold mb-4 flex items-center">
                                <Volume2 className="h-4 w-4 mr-2" />
                                In His Own Words
                              </h4>
                              <div className="space-y-4">
                                {item.quotes.map((quote, idx) => (
                                  <blockquote key={idx} className="border-l-4 border-orange-500/30 pl-4">
                                    <p className="text-muted-foreground italic text-lg leading-relaxed">"{quote}"</p>
                                    <cite className="text-orange-400 text-sm font-medium">- Erigga</cite>
                                  </blockquote>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Impact */}
                          {item.impact && (
                            <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 p-6 rounded-xl border border-orange-500/20">
                              <h4 className="text-orange-400 font-bold mb-4 flex items-center">
                                <Heart className="h-4 w-4 mr-2" />
                                Cultural Impact
                              </h4>
                              <p className="text-muted-foreground leading-relaxed italic">{item.impact}</p>
                            </div>
                          )}

                          {/* Stats Grid */}
                          {item.stats && (
                            <div className="grid grid-cols-3 gap-4">
                              {item.stats.map((stat, statIndex) => (
                                <div
                                  key={statIndex}
                                  className="text-center p-4 bg-card/60 rounded-xl border border-orange-500/10 hover:border-orange-500/30 transition-all"
                                >
                                  <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
                                    {stat.value}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expand/Collapse Button */}
                      <Button
                        variant="ghost"
                        onClick={() => toggleExpanded(item.id)}
                        className="w-full text-orange-400 hover:text-foreground hover:bg-orange-500/10 font-medium py-3 transition-all"
                      >
                        {expandedItems.has(item.id) ? (
                          <>
                            Hide Full Story <ChevronUp className="h-4 w-4 ml-2" />
                          </>
                        ) : (
                          <>
                            Read Full Story <ChevronDown className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Albums Section */}
      <section className="py-24 bg-gradient-to-b from-background via-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-bold text-sm mb-8">
              <Music className="h-4 w-4 mr-2" />
              COMPLETE DISCOGRAPHY
              <div className="w-2 h-2 rounded-full bg-black animate-pulse ml-3"></div>
            </div>
            <h2 className="text-5xl font-bold text-foreground mb-6">Albums & Music</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From "The Erigma" series to breakthrough hits, explore the complete musical journey of Nigeria's most
              authentic rap voice.
            </p>
          </div>

          <Card className="max-w-4xl mx-auto bg-card/90 border-orange-500/20 backdrop-blur-md shadow-2xl">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-bold text-foreground flex items-center">
                  <Music className="h-8 w-8 mr-3 text-orange-400" />
                  Erigga's Musical Legacy
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setAlbumsExpanded(!albumsExpanded)}
                  className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                >
                  {albumsExpanded ? (
                    <>
                      Collapse <ChevronUp className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Explore All <ChevronDown className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
              <CardDescription className="text-muted-foreground text-lg">
                {albumsData.length} major albums • {albumsData.reduce((total, album) => total + album.tracks, 0)} total
                tracks • The voice of the streets
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {albumsData.map((album) => (
                  <div
                    key={album.id}
                    className="aspect-square rounded-lg overflow-hidden border border-orange-500/20 cursor-pointer hover:border-orange-500/50 transition-all group"
                    onClick={() => setAlbumsExpanded(true)}
                  >
                    <img
                      src={album.coverImage || "/placeholder.svg"}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                ))}
              </div>

              {albumsExpanded && (
                <div className="space-y-8">
                  <Separator className="bg-gradient-to-r from-orange-500/20 via-yellow-500/40 to-orange-500/20" />

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {albumsData.map((album) => (
                      <Card
                        key={album.id}
                        className="bg-card/60 border-orange-500/10 overflow-hidden hover:border-orange-500/30 transition-all group"
                      >
                        <div className="relative aspect-square">
                          <img
                            src={album.coverImage || "/placeholder.svg"}
                            alt={album.title}
                            className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                            onClick={() =>
                              openLightbox(album.coverImage, `${album.title} (${album.year}) - Album Cover`)
                            }
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-xl font-bold text-white mb-1">{album.title}</h3>
                            <p className="text-orange-400 font-bold">{album.year}</p>
                          </div>
                        </div>

                        <CardContent className="p-6 space-y-4">
                          <p className="text-muted-foreground text-sm leading-relaxed">{album.description}</p>

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="font-medium">{album.tracks} tracks</span>
                            <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                              Album
                            </Badge>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <h4 className="text-foreground font-bold text-sm flex items-center">
                              <Headphones className="h-4 w-4 mr-2 text-orange-400" />
                              Stream Now:
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {album.streamingLinks.map((link, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="border-border text-muted-foreground hover:bg-muted hover:border-orange-500/30 justify-start transition-all"
                                  onClick={() => window.open(link.url, "_blank")}
                                >
                                  <Music className="w-3 h-3 mr-2" />
                                  <span className="text-xs font-medium">{link.platform}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer Section */}
      <section className="py-24 bg-gradient-to-b from-muted/50 via-background to-muted/50">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-bold text-sm mb-8">
            <span className="mr-2">THE PAPERBOI LEGACY</span>
            <div className="w-2 h-2 rounded-full bg-black animate-pulse"></div>
          </div>

          <h2 className="text-5xl font-bold text-foreground mb-8">From Warri to the World</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Erigga's story continues to unfold with each verse, each performance, each moment of authentic connection
            with his audience. The voice of the streets has become the voice of a generation.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-yellow-500 text-black hover:from-orange-600 hover:to-yellow-600 font-bold px-8 py-4 text-lg"
            >
              <ShoppingBag className="h-5 w-5 mr-3" />
              Official Merchandise
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 font-bold px-8 py-4 text-lg"
            >
              <Users className="h-5 w-5 mr-3" />
              Join the Movement
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-card/40 rounded-xl border border-orange-500/10">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
                5M+
              </div>
              <div className="text-sm text-muted-foreground mt-2 font-medium">Monthly Listeners</div>
            </div>
            <div className="text-center p-6 bg-card/40 rounded-xl border border-orange-500/10">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
                100M+
              </div>
              <div className="text-sm text-muted-foreground mt-2 font-medium">Total Streams</div>
            </div>
            <div className="text-center p-6 bg-card/40 rounded-xl border border-orange-500/10">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
                2M+
              </div>
              <div className="text-sm text-muted-foreground mt-2 font-medium">Social Followers</div>
            </div>
            <div className="text-center p-6 bg-card/40 rounded-xl border border-orange-500/10">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
                ∞
              </div>
              <div className="text-sm text-muted-foreground mt-2 font-medium">Cultural Impact</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default EriggaHomePage
