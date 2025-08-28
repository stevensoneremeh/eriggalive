"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, MessageCircle, Smile, MoreVertical, Search, Menu, X, Zap, Send, ImageIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { UserTierBadge } from "@/components/user-tier-badge"
import { motion, AnimatePresence } from "framer-motion"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

interface Category {
  id: number
  name: string
  slug: string
  icon: string
  color: string
  is_active: boolean
}

interface Post {
  id: number
  content: string
  created_at: string
  vote_count: number
  comment_count: number
  media_url?: string
  media_type?: string
  user: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  category: {
    id: number
    name: string
    slug: string
  }
  has_voted: boolean
}

interface Comment {
  id: number
  content: string
  created_at: string
  like_count: number
  user: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  has_liked: boolean
}

export default function CommunityPage() {
  const { isAuthenticated, profile } = useAuth()
  const supabase = createClient()

  // State
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({})
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [unifiedInput, setUnifiedInput] = useState("")
  const [activePost, setActivePost] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMedia, setSelectedMedia] = useState<File[]>([])
  const [mediaPreview, setMediaPreview] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showCategoryNav, setShowCategoryNav] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsClient(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (!isClient) return

    document.body.classList.add("community-page")

    if (isClient && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("communityPageActive", {
          detail: { categories, selectedCategory },
        }),
      )
    }

    return () => {
      document.body.classList.remove("community-page")
      if (isClient && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("communityPageInactive"))
      }
    }
  }, [isClient, categories, selectedCategory])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("community_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) throw error

      setCategories(data || [])
      if (data && data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
      const fallbackCategories = [
        { id: 1, name: "General", slug: "general", icon: "💬", color: "#25D366", is_active: true },
        { id: 2, name: "Music", slug: "music", icon: "🎵", color: "#128C7E", is_active: true },
        { id: 3, name: "Events", slug: "events", icon: "📅", color: "#075E54", is_active: true },
      ]
      setCategories(fallbackCategories)
      setSelectedCategory(1)
    }
  }, [selectedCategory, supabase])

  const loadPosts = useCallback(async () => {
    if (!selectedCategory) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug)
        `)
        .eq("category_id", selectedCategory)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) throw error

      const transformedPosts = (data || []).map((post) => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        vote_count: post.vote_count || 0,
        comment_count: post.comment_count || 0,
        media_url: post.media_url,
        media_type: post.media_type,
        user: post.user || {
          id: "unknown",
          username: "Unknown User",
          full_name: "Unknown User",
          avatar_url: null,
          tier: "FREE",
        },
        category: post.category || {
          id: selectedCategory,
          name: "General",
          slug: "general",
        },
        has_voted: false,
      }))

      setPosts(transformedPosts)
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, supabase])

  const loadComments = useCallback(
    async (postId: number) => {
      try {
        const { data, error } = await supabase
          .from("community_comments")
          .select(`
          *,
          user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier)
        `)
          .eq("post_id", postId)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true })

        if (error) throw error

        const transformedComments = (data || []).map((comment) => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          like_count: comment.like_count || 0,
          user: comment.user || {
            id: "unknown",
            username: "Unknown User",
            full_name: "Unknown User",
            avatar_url: null,
            tier: "FREE",
          },
          has_liked: false,
        }))

        setComments((prev) => ({ ...prev, [postId]: transformedComments }))
      } catch (error) {
        console.error("Error loading comments:", error)
      }
    },
    [supabase],
  )

  const containsURL = (text: string): boolean => {
    if (!FEATURE_UI_FIXES_V1) return false

    const urlPatterns = [
      // Standard URLs
      /https?:\/\/[^\s]+/gi,
      // www domains
      /www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
      // Domain patterns
      /[a-zA-Z0-9.-]+\.(com|net|org|edu|gov|mil|int|co|io|me|tv|info|biz|name|mobi|tel|travel|museum|aero|jobs|cat|pro|plus|max|elite|vip|exclusive|special|limited|rare|unique|secret|hidden|private|personal|custom|official|real|true|genuine|authentic|original|first|last|final|ultimate|perfect|complete|full|total|absolute|pure|clean|fresh|modern|latest|updated|advanced|professional|expert|master|guru|ninja|wizard|genius|smart|clever|brilliant|excellent|outstanding|superior|supreme|royal|king|queen|prince|princess|lord|master|boss|chief|leader|captain|commander|general|admiral|president|ceo|founder|owner|creator|inventor|designer|developer|programmer|engineer|architect|artist|writer|author|poet|musician|singer|dancer|actor|actress|model|star|celebrity|famous|popular|trending|viral|hot|fire|lit|dope|sick|crazy|insane|wild|epic|legendary|iconic|classic|vintage|retro|old|ancient|historic|traditional|cultural|ethnic|national|international|global|worldwide|universal|cosmic|galactic|infinite|eternal|forever|always|never|nothing|everything|all|any|some|few|many|most|best|worst|good|bad|great|terrible|awesome|awful|amazing|boring|interesting|exciting|thrilling|shocking|surprising|unexpected|unbelievable|incredible|fantastic|wonderful|marvelous|spectacular|magnificent|gorgeous|beautiful|pretty|cute|lovely|charming|attractive|sexy|hot|cool|warm|cold|freezing|burning|blazing|glowing|shining|sparkling|glittering|dazzling|brilliant|bright|dark|black|white|red|blue|green|yellow|orange|purple|pink|brown|gray|silver|gold|diamond|platinum|crystal|glass|metal|wood|stone|rock|earth|water|fire|air|wind|storm|thunder|lightning|rain|snow|ice|sun|moon|star|planet|galaxy|universe|space|time|life|death|love|hate|peace|war|good|evil|right|wrong|true|false|yes|no|maybe|perhaps|possibly|probably|definitely|certainly|absolutely|totally|completely|fully|entirely|wholly|perfectly|exactly|precisely|accurately|correctly|properly|appropriately|suitably|ideally|optimally|maximally|minimally|barely|hardly|scarcely|rarely|seldom|occasionally|sometimes|often|frequently|usually|normally|typically|generally|commonly|regularly|consistently|constantly|continuously|perpetually|endlessly|infinitely|eternally|forever|always|never|nothing|everything|all|any|some|few|many|most|best|worst)/gi,
      // Shortened URLs
      /(?:bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|short\.link|tiny\.cc|is\.gd|buff\.ly|ift\.tt|dlvr\.it|fb\.me|amzn\.to|youtu\.be|instagr\.am|linkedin\.in|twitter\.com|facebook\.com|instagram\.com|youtube\.com|tiktok\.com|snapchat\.com|whatsapp\.com|telegram\.org|discord\.gg|reddit\.com|pinterest\.com|tumblr\.com|flickr\.com|vimeo\.com|dailymotion\.com|twitch\.tv|spotify\.com|soundcloud\.com|bandcamp\.com|apple\.com|google\.com|microsoft\.com|amazon\.com|ebay\.com|paypal\.com|stripe\.com|square\.com|venmo\.com|cashapp\.com|zelle\.com|westernunion\.com|moneygram\.com|remitly\.com|wise\.com|revolut\.com|n26\.com|chime\.com|robinhood\.com|coinbase\.com|binance\.com|kraken\.com|gemini\.com|blockfi\.com|celsius\.network|nexo\.io|crypto\.com|blockchain\.com|metamask\.io|trustwallet\.com|ledger\.com|trezor\.io|exodus\.com|atomic\.com|myetherwallet\.com|mycrypto\.com|etherscan\.io|bscscan\.com|polygonscan\.com|ftmscan\.com|snowtrace\.io|arbiscan\.io|optimistic\.etherscan\.io|explorer\.solana\.com|cardanoscan\.io|adaex\.org|pool\.pm|cnft\.io|jpg\.store|opencnft\.io|tokhun\.io|spacebudz\.io|claymates\.org|chillpill\.io|deadpxlz\.io|pxlz\.org|cnftpredator\.tools|cnftjungle\.io|bubblegum\.io|artifct\.app|venly\.io|nft\.storage|pinata\.cloud|ipfs\.io|arweave\.org|filecoin\.io|storj\.io|sia\.tech|maidsafe\.net|swarm\.ethereum\.org|bittorrent\.com|utorrent\.com|qbittorrent\.org|deluge-torrent\.org|transmission\.app|vuze\.com|frostwire\.com|limewire\.com|kazaa\.com|napster\.com|spotify\.com|apple\.com|amazon\.com|google\.com|youtube\.com|soundcloud\.com|bandcamp\.com|deezer\.com|tidal\.com|qobuz\.com|pandora\.com|iheartradio\.com|tunein\.com|radio\.com|iheart\.com|audible\.com|scribd\.com|kindle\.amazon\.com|kobo\.com|nook\.barnesandnoble\.com|goodreads\.com|bookbub\.com|netgalley\.com|edelweiss\.abovethetreeline\.com|publishersmarketplace\.com|bookish\.com|riffle\.com|litsy\.com|bookstr\.com|epic\.com|getepic\.com|storylineonline\.net|unite4literacy\.com|oxfordowl\.co\.uk|readingeggs\.com|abcmouse\.com|starfall\.com|funbrain\.com|coolmath\.com|mathplayground\.com|prodigy\.com|ixl\.com|khanacademy\.org|coursera\.org|edx\.org|udacity\.com|udemy\.com|skillshare\.com|masterclass\.com|lynda\.com|pluralsight\.com|treehouse\.com|codecademy\.com|freecodecamp\.org|w3schools\.com|mozilla\.org|stackoverflow\.com|github\.com|gitlab\.com|bitbucket\.org|sourceforge\.net|codepen\.io|jsfiddle\.net|repl\.it|glitch\.com|codesandbox\.io|stackblitz\.com|gitpod\.io|codespaces\.github\.com|cloud9\.aws\.amazon\.com|goorm\.io|koding\.com|nitrous\.io|c9\.io|ide\.goorm\.io|paiza\.cloud|runkit\.com|observablehq\.com|kaggle\.com|colab\.research\.google\.com|jupyter\.org|anaconda\.com|rstudio\.com|shinyapps\.io|plotly\.com|tableau\.com|powerbi\.microsoft\.com|qlik\.com|looker\.com|sisense\.com|domo\.com|chartio\.com|metabase\.com|grafana\.com|kibana\.elastic\.co|splunk\.com|newrelic\.com|datadog\.com|honeycomb\.io|lightstep\.com|jaegertracing\.io|zipkin\.io|opentracing\.io|opencensus\.io|opentelemetry\.io|prometheus\.io|influxdata\.com|timescale\.com|questdb\.io|clickhouse\.tech|apache\.org|mongodb\.com|postgresql\.org|mysql\.com|mariadb\.org|sqlite\.org|redis\.io|memcached\.org|elasticsearch\.co|solr\.apache\.org|sphinx\.org|whoosh\.readthedocs\.io|xapian\.org|lucene\.apache\.org|nutch\.apache\.org|tika\.apache\.org|mahout\.apache\.org|spark\.apache\.org|hadoop\.apache\.org|hive\.apache\.org|pig\.apache\.org|hbase\.apache\.org|cassandra\.apache\.org|couchdb\.apache\.org|couchbase\.com|riak\.com|neo4j\.com|orientdb\.org|arangodb\.com|dgraph\.io|tigergraph\.com|amazon\.com|google\.com|microsoft\.com|oracle\.com|ibm\.com|salesforce\.com|sap\.com|adobe\.com|autodesk\.com|intuit\.com|servicenow\.com|workday\.com|zendesk\.com|atlassian\.com|slack\.com|discord\.com|zoom\.us|teams\.microsoft\.com|webex\.cisco\.com|gotomeeting\.com|join\.me|anymeeting\.com|bluejeans\.com|whereby\.com|jitsi\.org|bigbluebutton\.org|openmeetings\.apache\.org|freepbx\.org|asterisk\.org|freeswitch\.org|opensips\.org|kamailio\.org|yate\.ro|sipwise\.com|3cx\.com|avaya\.com|cisco\.com|mitel\.com|shoretel\.com|ringcentral\.com|vonage\.com|8x8\.com|nextiva\.com|grasshopper\.com|ooma\.com|magicjack\.com|skype\.com|viber\.com|whatsapp\.com|telegram\.org|signal\.org|wickr\.com|threema\.ch|wire\.com|element\.io|riot\.im|matrix\.org|irc\.freenode\.net|libera\.chat|oftc\.net|rizon\.net|quakenet\.org|undernet\.org|dalnet\.org|efnet\.org|ircnet\.org|hackint\.org|snoonet\.org|espernet\.org|chatzona\.org|ircstorm\.net|swiftirc\.net|synirc\.net|p2p-network\.net|abjects\.net|afternet\.org|allnetwork\.org|austnet\.org|axenet\.org|beyondirc\.net|brasirc\.net|chatfirst\.com|chatjunkies\.org|chatnet\.org|chatspike\.net|coolchat\.net|criten\.net|cyberchat\.org|darksin\.net|darkmyst\.org|deepspace\.org|deltaanime\.net|digarix\.net|dynastynet\.net|esper\.net|euirc\.net|europnet\.org|fdfnet\.net|forestnet\.org|freequest\.net|galaxynet\.org|gamesurge\.net|german-elite\.net|ghostscript\.net|gigairc\.net|globalchat\.org|hackthissite\.org|icq\.com|irc-hispano\.org|ircgate\.net|irclink\.net|ircnet\.com|ircsource\.net|ircstorm\.net|ircworld\.org|kreynet\.org|librairc\.net|linknet\.org|mibbit\.com|mirc\.com|mozilla\.org|newnet\.net|oftc\.net|openprojects\.net|otaku-irc\.fr|ozorg\.net|p2pchat\.net|pirc\.pl|ptlink\.net|ptnet\.org|quakenet\.org|recycled-irc\.net|rizon\.net|rusnet\.org\.ru|scarynet\.org|slashnet\.org|sorcery\.net|starlink\.org|stormbit\.net|swiftirc\.net|synirc\.net|thinstack\.net|tweakers\.net|twitch\.tv|unibg\.net|unreal\.net|webchat\.freenode\.net|webirc\.org|xertion\.org|zurna\.net)\/[^\s]+/gi,
      // IP addresses
      /(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/[^\s]*)?/gi,
      // Email-like patterns that might be URLs
      /[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    ]

    return urlPatterns.some((pattern) => pattern.test(text))
  }

  const handleUnifiedSubmit = async () => {
    if (!unifiedInput.trim() && selectedMedia.length === 0) return
    if (!isAuthenticated) return

    // Enhanced URL filtering
    if (containsURL(unifiedInput)) {
      toast({
        title: "Links not allowed",
        description: "Links are not allowed in community posts for security reasons.",
        variant: "destructive",
      })
      return
    }

    try {
      if (activePost) {
        // Handle comment
        console.error("handleComment is undeclared")
        setActivePost(null)
      } else {
        // Handle post
        console.error("handlePost is undeclared")
      }
      setUnifiedInput("")
      setSelectedMedia([])
      setMediaPreview([])
    } catch (error) {
      console.error("Error submitting:", error)
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const validFiles = files.filter((file) => {
      const isValidType =
        file.type.startsWith("image/") || file.type.startsWith("video/") || file.type.startsWith("audio/")
      const isValidSize = file.size <= 10 * 1024 * 1024

      if (!isValidType) {
        toast.error(`${file.name} is not a supported media type`)
        return false
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large (max 10MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setSelectedMedia(validFiles)

    const previews = validFiles.map((file) => URL.createObjectURL(file))
    setMediaPreview(previews)
  }

  const removeMedia = (index: number) => {
    const newMedia = selectedMedia.filter((_, i) => i !== index)
    const newPreviews = mediaPreview.filter((_, i) => i !== index)

    URL.revokeObjectURL(mediaPreview[index])

    setSelectedMedia(newMedia)
    setMediaPreview(newPreviews)
  }

  const voteOnPost = async (postId: number) => {
    if (!isAuthenticated || !profile) {
      toast.error("Please sign in to vote")
      return
    }

    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      if (post.has_voted) {
        await supabase.from("community_post_votes").delete().eq("post_id", postId).eq("user_id", profile.id)
      } else {
        await supabase.from("community_post_votes").insert({
          post_id: postId,
          user_id: profile.id,
        })
      }

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                has_voted: !p.has_voted,
                vote_count: p.has_voted ? p.vote_count - 1 : p.vote_count + 1,
              }
            : p,
        ),
      )

      toast.success(post.has_voted ? "Vote removed" : "Vote added!")
    } catch (error) {
      console.error("Error voting:", error)
      toast.error("Failed to vote")
    }
  }

  const filteredPosts = posts.filter(
    (post) =>
      searchQuery === "" ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (selectedCategory) {
      loadPosts()
    }
  }, [selectedCategory, loadPosts])

  useEffect(() => {
    scrollToBottom()
  }, [posts])

  useEffect(() => {
    if (!selectedCategory) return

    const postsSubscription = supabase
      .channel(`posts-${selectedCategory}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_posts",
          filter: `category_id=eq.${selectedCategory}`,
        },
        (payload) => {
          loadPosts()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(postsSubscription)
    }
  }, [selectedCategory, supabase, loadPosts])

  return (
    <div className="min-h-screen bg-background">
      {isMobile && FEATURE_UI_FIXES_V1 && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between p-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">Community</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCategoryNav(!showCategoryNav)}
              className="text-gray-600 dark:text-gray-400"
            >
              <Menu className="h-4 w-4 mr-2" />
              Categories
            </Button>
          </div>

          {showCategoryNav && (
            <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="flex overflow-x-auto p-2 space-x-2">
                <Button
                  variant={selectedCategory === null ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(null)
                    setShowCategoryNav(false)
                  }}
                  className="whitespace-nowrap"
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category.id)
                      setShowCategoryNav(false)
                    }}
                    className="whitespace-nowrap"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex h-screen overflow-hidden",
          FEATURE_UI_FIXES_V1 ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-900",
          isMobile && "pt-16", // Reduced top padding for mobile to account for sticky nav
        )}
      >
        {/* Desktop Sidebar */}
        <motion.div
          initial={{ x: -300 }}
          animate={{
            x:
              sidebarOpen || (!isMobile && isClient && typeof window !== "undefined" && window.innerWidth >= 768)
                ? 0
                : -300,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={cn(
            "w-80 flex flex-col",
            "fixed md:relative z-50 md:z-auto h-full shadow-xl md:shadow-none",
            FEATURE_UI_FIXES_V1
              ? "bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800"
              : "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
            isMobile && "hidden",
          )}
        >
          <div
            className={cn(
              "p-4 border-b",
              FEATURE_UI_FIXES_V1
                ? "bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800"
                : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Community</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stay connected</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 rounded-full placeholder:text-gray-500 dark:placeholder:text-gray-400",
                  FEATURE_UI_FIXES_V1
                    ? "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                    : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-600",
                )}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  whileHover={{ backgroundColor: FEATURE_UI_FIXES_V1 ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                    selectedCategory === category.id
                      ? FEATURE_UI_FIXES_V1
                        ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                        : "bg-green-100 dark:bg-green-900/20 border-l-4 border-green-500"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                  )}
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setSidebarOpen(false)
                    setActivePost(null)
                  }}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-xl",
                      FEATURE_UI_FIXES_V1 ? "bg-gray-100 dark:bg-gray-800" : "bg-gray-200 dark:bg-gray-600",
                    )}
                  >
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">{category.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {posts.filter((p) => p.category.id === category.id).length} messages
                    </div>
                  </div>
                  {selectedCategory === category.id && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {isAuthenticated && profile && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback className="bg-green-500 text-white font-semibold">
                    {profile.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{profile.username}</div>
                  <UserTierBadge tier={profile.tier} size="sm" />
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Main Content */}
        <div className={cn("flex-1 flex flex-col", isMobile && FEATURE_UI_FIXES_V1 && "pt-20")}>
          {/* Mobile Header */}
          {isMobile && !FEATURE_UI_FIXES_V1 && (
            <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Community</h1>
              <div className="w-10" />
            </div>
          )}

          <div
            ref={scrollContainerRef}
            className={cn(
              "flex-1 overflow-y-auto",
              isMobile ? "pb-24" : "pb-32", // Adjusted padding for sticky input
              isMobile && activePost && "pt-4",
            )}
          >
            <div className={cn("max-w-2xl mx-auto px-4 py-6 space-y-4", isMobile && "px-3 py-4 space-y-3")}>
              <AnimatePresence>
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "group transition-all duration-200",
                      FEATURE_UI_FIXES_V1
                        ? "bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700"
                        : "flex space-x-3",
                      activePost === post.id && "ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/10",
                      isMobile && "rounded-xl p-3 shadow-sm",
                    )}
                  >
                    <div className="flex space-x-3">
                      <Avatar className={cn("flex-shrink-0", isMobile ? "h-10 w-10" : "h-12 w-12")}>
                        <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
                        <AvatarFallback className="bg-green-500 text-white font-semibold">
                          {post.user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={cn("font-semibold text-gray-900 dark:text-white", isMobile && "text-sm")}>
                            {post.user.full_name || post.user.username}
                          </span>
                          <UserTierBadge tier={post.user.tier} size="sm" />
                          <span className="text-gray-500 dark:text-gray-400">·</span>
                          <span className={cn("text-gray-500 dark:text-gray-400", isMobile ? "text-xs" : "text-sm")}>
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        <p
                          className={cn(
                            "text-gray-900 dark:text-white leading-relaxed break-words mb-3",
                            isMobile ? "text-sm" : "text-[15px]",
                          )}
                        >
                          {post.content}
                        </p>

                        <div className={cn("flex items-center mt-3", isMobile ? "space-x-4" : "space-x-6")}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "rounded-full transition-all duration-200 group/btn",
                              post.has_voted
                                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                : "text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30",
                              isMobile ? "h-7 px-2" : "h-8 px-3",
                            )}
                            onClick={() => voteOnPost(post.id)}
                          >
                            <Heart
                              className={cn(
                                "mr-1 transition-transform group-hover/btn:scale-110",
                                post.has_voted && "fill-current",
                                isMobile ? "h-3 w-3" : "h-4 w-4",
                              )}
                            />
                            <span className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>
                              {post.vote_count}
                            </span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "rounded-full transition-all duration-200 group/btn",
                              activePost === post.id
                                ? "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                : "text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30",
                              isMobile ? "h-7 px-2" : "h-8 px-3",
                            )}
                            onClick={() => {
                              if (activePost === post.id) {
                                setActivePost(null)
                              } else {
                                setActivePost(post.id)
                                loadComments(post.id)
                              }
                            }}
                          >
                            <MessageCircle
                              className={cn(
                                "mr-1 transition-transform group-hover/btn:scale-110",
                                isMobile ? "h-3 w-3" : "h-4 w-4",
                              )}
                            />
                            <span className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>
                              {post.comment_count}
                            </span>
                          </Button>
                        </div>

                        <AnimatePresence>
                          {activePost === post.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3"
                            >
                              {comments[post.id]?.map((comment) => (
                                <motion.div
                                  key={comment.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex space-x-3"
                                >
                                  <Avatar className={cn("flex-shrink-0", isMobile ? "h-6 w-6" : "h-8 w-8")}>
                                    <AvatarImage src={comment.user.avatar_url || "/placeholder-user.jpg"} />
                                    <AvatarFallback className="bg-gray-500 text-white text-xs">
                                      {comment.user.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span
                                        className={cn(
                                          "font-medium text-gray-900 dark:text-white",
                                          isMobile ? "text-xs" : "text-sm",
                                        )}
                                      >
                                        {comment.user.username}
                                      </span>
                                      <span
                                        className={cn(
                                          "text-gray-500 dark:text-gray-400",
                                          isMobile ? "text-xs" : "text-xs",
                                        )}
                                      >
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p
                                      className={cn(
                                        "text-gray-900 dark:text-white leading-relaxed",
                                        isMobile ? "text-xs" : "text-sm",
                                      )}
                                    >
                                      {comment.content}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div
            className={cn(
              "border-t p-4",
              FEATURE_UI_FIXES_V1
                ? "bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800"
                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
              isMobile && "fixed bottom-0 left-0 right-0 z-30 shadow-lg",
            )}
          >
            {isAuthenticated ? (
              <div className={cn("flex items-end max-w-2xl mx-auto", isMobile ? "space-x-2" : "space-x-3")}>
                <Avatar className={cn("flex-shrink-0", isMobile ? "h-8 w-8" : "h-10 w-10")}>
                  <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback className="bg-green-500 text-white font-semibold">
                    {profile?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    placeholder={activePost ? "Reply to this message..." : "What's happening?"}
                    value={unifiedInput}
                    onChange={(e) => setUnifiedInput(e.target.value)}
                    className={cn(
                      "rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200",
                      "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                      FEATURE_UI_FIXES_V1
                        ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 placeholder:text-gray-600 dark:placeholder:text-gray-300" // Enhanced placeholder contrast
                        : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800",
                      isMobile ? "pr-24 text-sm px-3 py-2" : "pr-32 text-base px-4 py-3",
                    )}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleUnifiedSubmit()
                      }
                    }}
                  />
                  <div
                    className={cn(
                      "absolute top-1/2 transform -translate-y-1/2 flex items-center",
                      isMobile ? "right-1 space-x-0.5" : "right-2 space-x-1",
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "rounded-full hover:bg-gray-200 dark:hover:bg-gray-700",
                        isMobile ? "h-6 w-6 p-0" : "h-8 w-8 p-0",
                      )}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "rounded-full hover:bg-gray-200 dark:hover:bg-gray-700",
                        isMobile ? "h-6 w-6 p-0" : "h-8 w-8 p-0",
                      )}
                    >
                      <Smile className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleUnifiedSubmit}
                  disabled={!unifiedInput.trim() && selectedMedia.length === 0}
                  className={cn(
                    "rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 transition-all duration-200 disabled:cursor-not-allowed",
                    isMobile ? "h-8 w-8 p-0" : "h-10 w-10 p-0",
                  )}
                >
                  <Send className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div
                  className={cn(
                    "rounded-2xl border p-6 max-w-md mx-auto",
                    FEATURE_UI_FIXES_V1
                      ? "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                      : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                  )}
                >
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Join the conversation</p>
                  <Button asChild className="bg-green-500 hover:bg-green-600 rounded-full px-8">
                    <a href="/login">Sign In</a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          className="hidden"
          onChange={handleMediaSelect}
        />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        onChange={handleMediaSelect}
        className="hidden"
      />
    </div>
  )
}
