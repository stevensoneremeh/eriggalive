"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, MessageCircle, Search, ImageIcon, Mic } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { UserTierBadge } from "@/components/user-tier-badge"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

const CommunityPage = () => {
  const { supabase, isAuthenticated, profile } = useAuth()
  const [unifiedInput, setUnifiedInput] = useState("")
  const [selectedMedia, setSelectedMedia] = useState([])
  const [mediaPreview, setMediaPreview] = useState([])
  const [activePost, setActivePost] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState({})
  const scrollAreaRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching posts:", error)
        toast.error("Failed to load posts")
      } else {
        setPosts(data)
      }
    }

    fetchPosts()
  }, [supabase])

  const containsURL = (text: string): boolean => {
    if (!FEATURE_UI_FIXES_V1) {
      // Original basic URL detection
      const urlPatterns = [
        /https?:\/\/[^\s]+/gi, // http/https URLs
        /www\.[^\s]+/gi, // www.domain.com
        /\b[a-z0-9.-]+\.(com|net|org|xyz|info|io|co|uk|ca|de|fr|jp|au|in|br|ru|cn|gov|edu|mil)\b/gi, // domain.extension
        /[a-z0-9.-]+\.(com|net|org|xyz|info|io|co|uk|ca|de|fr|jp|au|in|br|ru|cn|gov|edu|mil)\/[^\s]*/gi, // domain.extension/path
      ]
      return urlPatterns.some((pattern) => pattern.test(text))
    }

    // Enhanced URL detection patterns - simplified to avoid regex complexity issues
    const enhancedUrlPatterns = [
      // Standard HTTP/HTTPS URLs
      /https?:\/\/[^\s]+/gi,

      // www.domain patterns
      /www\.[a-z0-9.-]+\.[a-z]{2,}/gi,

      // Domain.extension patterns with common TLDs
      /\b[a-z0-9.-]+\.(com|net|org|edu|gov|mil|co|uk|ca|au|de|fr|jp|cn|in|br|ru|info|biz|io|xyz|me|tv|cc|ly|gl|to|be|it|us|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|si|sk|ee|lv|lt|ie|pt|gr|cy|mt|lu|at|ch|li|is|ad|mc|sm|va|gi|im|je|gg)\b/gi,

      // Popular URL shorteners (simplified list)
      /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|short\.link|tiny\.cc|is\.gd|youtu\.be|amzn\.to|fb\.me|lnkd\.in|wp\.me|buff\.ly|ift\.tt|dlvr\.it|po\.st|shar\.es|su\.pr|j\.mp|snipurl\.com|tr\.im|tl\.gd|cli\.gs|go\.usa\.gov|1\.usa\.gov|tweez\.me|budurl\.com|ff\.im|url\.ie|short\.ie|prettylinkpro\.com|scrnch\.me|filoops\.info|virl\.com|2tu\.us|lnk\.gd|qr\.ae|cutt\.us|b23\.ru|short\.gy|rb\.gy|short\.link|tiny\.one|t2mio\.com|lstu\.fr|kutt\.it|polr\.me|short\.cm|git\.io|aka\.ms|s\.id|chilp\.it|clicky\.me|budurl\.com|shorl\.com|xr\.com|u\.nu|metamark\.net|makeashorterlink\.com|tinyarrows\.com|6url\.com|shorturl\.com|icanhaz\.com|easyurl\.net|doiop\.com|littleurl\.net|lnk\.ms|sn\.im|tiny\.pl|zi\.ma|korta\.nu|shrten\.com|x\.co|2big\.at|dwarfurl\.com|easyuri\.com|ezurl\.cc|fa\.b|fon\.gs|freak\.to|fuseurl\.com|fuzzy\.to|g00\.me|hit\.my|id\.tl|iscool\.net|just\.as|kissa\.be|kl\.am|klck\.me|korta\.nu|krunchd\.com|l9k\.net|liltext\.com|linkbee\.com|linkto\.run|liurl\.cn|ln-s\.net|lnk\.gd|lnk\.ms|lnkd\.in|lnkurl\.com|lru\.jp|lt\.tl|lurl\.no|lynk\.my|m1p\.fr|makeagif\.com|mcaf\.ee|mdl29\.net|merky\.de|migre\.me|miniurl\.com|minurl\.fr|mke\.me|moby\.to|moourl\.com|mrte\.ch|myloc\.me|myurl\.in|n\.pr|nbc\.co|nblo\.gs|nn\.nf|not\.my|notlong\.com|nsfw\.in|nutshellurl\.com|nxy\.in|nyti\.ms|o-x\.fr|oc1\.us|om\.ly|omf\.gd|omoikane\.net|onforb\.es|orz\.se|ow\.ly|p\.pw|para\.pt|parky\.tv|past\.is|pdh\.co|ph\.dog|pich\.in|pin\.st|ping\.fm|piurl\.com|pli\.gs|pnt\.me|politi\.co|post\.ly|pp\.gg|profile\.to|ptiturl\.com|qlnk\.net|qte\.me|qu\.tc|qy\.fi|r\.im|rb6\.me|read\.bi|readability\.com|reallytinyurl\.com|redir\.ec|redirects\.ca|redirx\.com|retwt\.me|ri\.ms|rickroll\.it|riz\.gd|rt\.nu|ru\.ly|rubyurl\.com|rurl\.org|rww\.tw|s4c\.in|s7y\.us|safe\.mn|sameurl\.com|sdut\.us|shar\.es|shink\.de|shorl\.com|short\.ie|shortlinks\.co\.uk|shorturl\.com|shout\.to|show\.my|shrinkify\.com|shrinkr\.com|shrt\.fr|shrunkin\.com|simurl\.com|slate\.me|smallr\.com|smsh\.me|smurl\.name|sn\.im|snipr\.com|snipurl\.com|snurl\.com|sp2\.ro|spedr\.com|srnk\.net|srs\.li|starturl\.com|su\.pr|surl\.co\.uk|surl\.hu|t\.cn|t\.co|t\.lh\.com|ta\.gd|tbd\.ly|tcrn\.ch|tgr\.me|tgr\.ph|tighturl\.com|tiniuri\.com|tiny\.cc|tiny\.ly|tiny\.pl|tinylink\.in|tinyuri\.ca|tinyurl\.com|tl\.gd|tmi\.me|tnij\.org|tnw\.to|tny\.com|to\.ly|togoto\.us|totc\.us|toysr\.us|tpm\.ly|tr\.im|tra\.kz|trunc\.it|twhub\.com|twirl\.at|twitclicks\.com|twitterpan\.com|twitterurl\.net|twitterurl\.org|twiturl\.de|twurl\.cc|twurl\.nl|u\.mavrev\.com|u\.nu|u76\.org|ub0\.cc|ulu\.lu|updating\.me|ur1\.ca|url\.az|url\.co\.uk|url\.ie|url4\.eu|urlborg\.com|urlbrief\.com|urlcover\.com|urlcut\.com|urlenco\.de|urli\.nl|urls\.im|urlx\.ie|urlzen\.com|usat\.ly|use\.my|vb\.ly|vgn\.am|virl\.com|vl\.am|vm\.lc|w55c\.net|wapo\.st|wapurl\.co\.uk|wipi\.es|wp\.me|x\.vu|xr\.com|xrl\.in|xrl\.us|xurl\.es|xzb\.cc|yatuc\.com|ye\.pe|yep\.it|yfrog\.com|yhoo\.it|yiyd\.com|youtu\.be|yuarel\.com|z0p\.de|zi\.ma|zi\.mu|zipmyurl\.com|zud\.me|zurl\.ws|zws\.im|zyva\.org)\/[^\s]*/gi,

      // IP addresses (IPv4)
      /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]+)?\b/gi,

      // Domain patterns without protocol
      /\b[a-z0-9.-]+\.[a-z]{2,}\/[^\s]*/gi,

      // Email addresses (often used to bypass filters)
      /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,

      // Common obfuscation patterns
      /h..p[s]?:\/\/[^\s]+/gi,
      /w{3}\.[^\s]+/gi,

      // URL-like patterns with spaces or special characters (bypass attempts)
      /\b[a-z0-9.-]+\s*\.\s*[a-z]{2,}/gi,
      /\b[a-z0-9.-]+\[dot\][a-z]{2,}/gi,
    ]

    return enhancedUrlPatterns.some((pattern) => pattern.test(text))
  }

  // Enhanced content validation with security measures
  const validateContent = (text: string): { isValid: boolean; reason?: string } => {
    if (!FEATURE_UI_FIXES_V1) {
      return { isValid: true }
    }

    // Check for URLs
    if (containsURL(text)) {
      return { isValid: false, reason: "Links and URLs are not allowed in community posts" }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      // Potential spam indicators
      /\b(click here|visit now|limited time|act now|urgent|free money|make money|work from home|get rich|lose weight|miracle cure)\b/gi,

      // Potential phishing indicators
      /\b(verify account|suspended account|click to verify|update payment|confirm identity|security alert)\b/gi,

      // Excessive repetition (spam indicator)
      /(.)\1{10,}/gi, // Same character repeated 10+ times
      /(\b\w+\b)(\s+\1){5,}/gi, // Same word repeated 5+ times

      // Excessive caps (spam indicator)
      /[A-Z]{20,}/g, // 20+ consecutive caps
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        return { isValid: false, reason: "Content appears to be spam or suspicious" }
      }
    }

    // Check content length
    if (text.length > 2000) {
      return { isValid: false, reason: "Content is too long (max 2000 characters)" }
    }

    // Check for excessive special characters (potential spam)
    const specialCharCount = (text.match(/[!@#$%^&*()_+={}[\]|\\:";'<>?,./]/g) || []).length
    if (specialCharCount > text.length * 0.3) {
      return { isValid: false, reason: "Content contains too many special characters" }
    }

    return { isValid: true }
  }

  const handleUnifiedSubmit = async () => {
    if (!unifiedInput.trim() || !isAuthenticated || !profile) {
      if (!isAuthenticated) {
        toast.error("Please sign in to participate")
      }
      return
    }

    // Enhanced content validation with detailed error messages
    const validation = validateContent(unifiedInput)
    if (!validation.isValid) {
      toast.error(validation.reason || "Content validation failed", {
        description: FEATURE_UI_FIXES_V1
          ? "Please share your thoughts without including URLs, excessive caps, or spam-like content"
          : "Please share your thoughts without including URLs",
        duration: 4000,
      })
      return
    }

    // Legacy URL check for backward compatibility
    if (!FEATURE_UI_FIXES_V1 && containsURL(unifiedInput)) {
      toast.error("Links are not allowed in community posts", {
        description: "Please share your thoughts without including URLs",
        duration: 4000,
      })
      return
    }

    try {
      const mediaUrl = null
      let mediaType = null

      if (selectedMedia.length > 0) {
        const file = selectedMedia[0]
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`

        if (file.type.startsWith("image/")) {
          mediaType = "image"
        } else if (file.type.startsWith("video/")) {
          mediaType = "video"
        } else if (file.type.startsWith("audio/")) {
          mediaType = "audio"
        }
      }

      if (activePost) {
        const { data, error } = await supabase
          .from("community_comments")
          .insert({
            content: unifiedInput.trim(),
            user_id: profile.id,
            post_id: activePost,
            is_deleted: false,
          })
          .select(`
            *,
            user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier)
          `)
          .single()

        if (error) throw error

        const newComment = {
          id: data.id,
          content: data.content,
          created_at: data.created_at,
          like_count: 0,
          user: data.user,
          has_liked: false,
        }

        setComments((prev) => ({
          ...prev,
          [activePost]: [...(prev[activePost] || []), newComment],
        }))

        setPosts((prev) =>
          prev.map((post) => (post.id === activePost ? { ...post, comment_count: post.comment_count + 1 } : post)),
        )

        toast.success("Comment added!")
      } else {
        if (!selectedCategory) return

        const { data, error } = await supabase
          .from("community_posts")
          .insert({
            content: unifiedInput.trim(),
            user_id: profile.id,
            category_id: selectedCategory,
            media_url: mediaUrl,
            media_type: mediaType,
            is_published: true,
            is_deleted: false,
          })
          .select(`
            *,
            user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
            category:community_categories!community_posts_category_id_fkey(id, name, slug)
          `)
          .single()

        if (error) throw error

        const newPost = {
          id: data.id,
          content: data.content,
          created_at: data.created_at,
          vote_count: 0,
          comment_count: 0,
          media_url: data.media_url,
          media_type: data.media_type,
          user: data.user,
          category: data.category,
          has_voted: false,
        }

        setPosts((prev) => [...prev, newPost])
        setTimeout(scrollToBottom, 100)
        toast.success("Message sent!")
      }

      setUnifiedInput("")
      setSelectedMedia([])
      setMediaPreview([])
    } catch (error) {
      console.error("Error submitting:", error)
      toast.error("Failed to send")
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-background p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Community</h1>
          {/* Search bar */}
          <div className="relative">
            <Input type="text" placeholder="Search..." className="pl-10" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        {/* Posts */}
        {posts.map((post) => (
          <div key={post.id} className="p-4 border-b">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={post.user.avatar_url || "/placeholder.svg"} alt={post.user.username} />
                <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{post.user.username}</span>
                  <UserTierBadge tier={post.user.tier} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p>{post.content}</p>
              {post.media_url && (
                <div className="mt-4">
                  {post.media_type === "image" && (
                    <img src={post.media_url || "/placeholder.svg"} alt="Post media" className="max-w-full h-auto" />
                  )}
                  {post.media_type === "video" && (
                    <video controls className="max-w-full h-auto">
                      <source src={post.media_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                  {post.media_type === "audio" && (
                    <audio controls className="max-w-full">
                      <source src={post.media_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{post.vote_count}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{post.comment_count}</span>
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>

      {/* Footer */}
      <div className="bg-background p-4 border-t">
        <Input
          type="text"
          placeholder="Write a message..."
          value={unifiedInput}
          onChange={(e) => setUnifiedInput(e.target.value)}
          className="w-full mb-4"
        />
        {/* Media upload */}
        <div className="flex items-center space-x-2">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          <Mic className="h-5 w-5 text-muted-foreground" />
          <Button onClick={handleUnifiedSubmit}>Send</Button>
        </div>
      </div>
    </div>
  )
}

export default CommunityPage
