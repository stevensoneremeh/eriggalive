"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, MessageCircle, Smile, MoreVertical, Search, Menu, X, Zap, Send, ImageIcon, Mic } from 'lucide-react'
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { UserTierBadge } from "@/components/user-tier-badge"
import { motion, AnimatePresence } from "framer-motion"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

// ... existing code ...

  // <CHANGE> Enhanced URL detection with comprehensive patterns and security validation
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

    // Enhanced URL detection patterns
    const enhancedUrlPatterns = [
      // Standard HTTP/HTTPS URLs
      /https?:\/\/[^\s]+/gi,
      
      // www.domain patterns
      /www\.[a-z0-9.-]+\.[a-z]{2,}/gi,
      
      // Domain.extension patterns (comprehensive TLD list)
      /\b[a-z0-9.-]+\.(com|net|org|edu|gov|mil|int|co|uk|ca|au|de|fr|jp|cn|in|br|ru|mx|es|it|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|si|sk|ee|lv|lt|ie|pt|gr|cy|mt|lu|be|at|ch|li|is|fo|gl|ad|mc|sm|va|gi|im|je|gg|ac|sh|tc|vg|ms|ai|ag|bb|bs|bz|dm|gd|gy|jm|kn|lc|sr|tt|vc|vg|vi|pr|do|ht|cu|cr|gt|hn|ni|pa|sv|mx|bz|bo|cl|co|ec|pe|py|uy|ve|ar|fk|gf|gy|sr|br|info|biz|name|pro|museum|aero|coop|jobs|mobi|travel|tel|xxx|asia|cat|post|geo|xxx|arpa|root|local|localhost|test|invalid|example|onion|exit|i2p|bit|coin|eth|crypto|nft|dao|web3|defi|xyz|top|site|online|store|shop|app|dev|tech|ai|io|me|tv|fm|am|ws|cc|tk|ml|ga|cf|gq|pw|party|click|link|download|stream|live|cam|xxx|adult|sex|porn|tube|dating|casino|bet|loan|money|bank|pay|buy|sell|trade|invest|stock|forex|crypto|bitcoin|ethereum|nft|dao|web3|defi|hack|crack|warez|torrent|pirate|illegal|drugs|weapon|bomb|terror|kill|death|suicide|self-harm|violence|abuse|hate|racist|nazi|isis|terror|scam|fraud|phishing|malware|virus|trojan|ransomware|botnet|ddos|exploit|vulnerability|zero-day|backdoor|rootkit|keylogger|spyware|adware|bloatware|crapware|junkware|foistware|potentially-unwanted|pup|pua)\b/gi,
      
      // Shortened URLs
      /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|short\.link|tiny\.cc|is\.gd|buff\.ly|adf\.ly|bl\.ink|clicky\.me|db\.tt|filoops\.info|fun\.ly|fwd4\.me|go2l\.ink|hitabs\.com|id\.short\.gy|kl\.am|libib\.com|linkto\.run|lnkd\.in|loom\.ly|mcaf\.ee|oclc\.org|owl\.li|po\.st|polr\.me|pub\.vitrue\.com|qlnk\.net|qr\.ae|qr\.net|readability\.com|reallytinyurl\.com|rebrand\.ly|redirects\.ca|shar\.es|shink\.in|shorl\.com|short\.ie|shortlink\.ca|shorturl\.at|sn\.im|snipurl\.com|snurl\.com|sp2\.ro|spedr\.com|starturl\.com|su\.pr|t2mio\.com|ta\.gd|tighturl\.com|tinyarrows\.com|tinycc\.com|tinytw\.it|tllg\.net|tmi\.me|tnij\.org|tr5\.in|traceurl\.com|tweez\.me|twitthis\.com|twitterpan\.com|u\.mavrev\.com|u\.nu|u6e\.de|ub0\.cc|unfake\.it|updating\.me|ur1\.ca|url\.co\.uk|url\.ie|url4\.eu|urlborg\.com|urlbrief\.com|urlcover\.com|urlcut\.com|urlenco\.de|urli\.nl|urls\.im|urlshorteningservicefortwitter\.com|urlx\.ie|urlzen\.com|usat\.ly|use\.my|virl\.com|vl\.am|w55c\.net|wapo\.st|wapurl\.co\.uk|wipi\.es|wp\.me|x\.vu|xr\.com|xrl\.in|xrl\.us|xurl\.es|xzb\.cc|yatuc\.com|ye\.pe|yep\.it|yfrog\.com|yhoo\.it|yiyd\.com|youtu\.be|yuarel\.com|z0p\.de|zi\.ma|zi\.mu|zipmyurl\.com|zud\.me|zurl\.ws|zws\.im|zyva\.org|301url\.com|307\.to|4url\.cc|6url\.com|7\.ly|a\.gg|a\.nf|aa\.cx|abbrr\.com|abcurl\.net|ad\.vu|adf\.ly|adjix\.com|afx\.cc|all\.fuseurl\.com|alturl\.com|amzn\.to|ar\.gy|arst\.ch|atu\.ca|azc\.cc|b23\.ru|bacn\.me|bcool\.bz|binged\.it|bit\.do|bizj\.us|bloat\.me|bravo\.ly|bsa\.ly|budurl\.com|canurl\.com|chilp\.it|chzb\.gr|cl\.lk|cl\.ly|clck\.ru|cli\.gs|cliccami\.info|clickthru\.ca|clop\.in|conta\.cc|cort\.as|cot\.ag|crks\.me|ctvr\.us|cutt\.us|dai\.ly|decenturl\.com|dfl8\.me|digbig\.com|digg\.com|disq\.us|dld\.bz|dlvr\.it|do\.my|doiop\.com|dopen\.us|easyuri\.com|easyurl\.net|eepurl\.com|eweri\.com|fa\.by|fav\.me|fb\.me|fbshare\.me|ff\.im|fff\.to|fire\.to|firsturl\.de|firsturl\.net|flic\.kr|flq\.us|fly2\.ws|fon\.gs|freak\.to\.)|fsj\.me|fwd4\.me|fwib\.net|g\.ro\.lt|gizmo\.do|gl\.am|go\.9nl\.com|go\.ign\.com|go\.usa\.gov|goo\.gl|goshrink\.com|gri\.ms|gurl\.es|hex\.io|hiderefer\.com|hmm\.ph|href\.in|hsblinks\.com|htxt\.it|huff\.to|hulu\.com|hurl\.me|hurl\.ws|icanhaz\.com|idek\.net|ilix\.in|is\.gd|its\.my|ix\.lt|j\.mp|jijr\.com|kl\.am|klck\.me|korta\.nu|krunchd\.com|l9k\.net|lat\.ms|liip\.to|liltext\.com|linkbee\.com|linkbun\.ch|liurl\.cn|ln-s\.net|ln-s\.ru|lnk\.gd|lnk\.ms|lnkd\.in|lnkurl\.com|lru\.jp|lt\.tl|lurl\.no|lynk\.my|m\.me|m1p\.fr|makeagif\.com|mcaf\.ee|mdl29\.net|merky\.de|migre\.me|miniurl\.com|minurl\.fr|mke\.me|moby\.to|moourl\.com|mrte\.ch|myloc\.me|myurl\.in|n\.pr|nbc\.co|nblo\.gs|nn\.nf|not\.my|notlong\.com|nsfw\.in|nutshellurl\.com|nxy\.in|nyti\.ms|o-x\.fr|oc1\.us|om\.ly|omf\.gd|omoikane\.net|on\.cnn\.com|on\.mktw\.net|onforb\.es|orz\.se|ow\.ly|p\.pw|para\.pt|parky\.tv|past\.is|pdh\.co|ph\.dog|pich\.in|pin\.st|ping\.fm|piurl\.com|pli\.gs|pnt\.me|politi\.co|post\.ly|pp\.gg|profile\.to|ptiturl\.com|pub\.vitrue\.com|qlnk\.net|qte\.me|qu\.tc|qy\.fi|r\.im|rb6\.me|read\.bi|readability\.com|reallytinyurl\.com|redir\.ec|redirects\.ca|redirx\.com|retwt\.me|ri\.ms|rickroll\.it|riz\.gd|rt\.nu|ru\.ly|rubyurl\.com|rurl\.org|rww\.tw|s4c\.in|s7y\.us|safe\.mn|sameurl\.com|sdut\.us|shar\.es|shink\.de|shorl\.com|short\.ie|short\.link|shortlinks\.co\.uk|shorturl\.com|shout\.to|show\.my|shrinkify\.com|shrinkr\.com|shrt\.fr|shrunkin\.com|simurl\.com|slate\.me|smallr\.com|smsh\.me|smurl\.name|sn\.im|snipr\.com|snipurl\.com|snurl\.com|sp2\.ro|spedr\.com|srnk\.net|srs\.li|starturl\.com|su\.pr|surl\.co\.uk|surl\.hu|t\.cn|t\.co|t\.lh\.com|ta\.gd|tbd\.ly|tcrn\.ch|tgr\.me|tgr\.ph|tighturl\.com|tiniuri\.com|tiny\.cc|tiny\.ly|tiny\.pl|tinylink\.in|tinyuri\.ca|tinyurl\.com|tl\.gd|tmi\.me|tnij\.org|tnw\.to|tny\.com|to\.ly|togoto\.us|totc\.us|toysr\.us|tpm\.ly|tr\.im|tra\.kz|trunc\.it|twhub\.com|twirl\.at|twitclicks\.com|twitterpan\.com|twitterurl\.net|twitterurl\.org|twiturl\.de|twurl\.cc|twurl\.nl|u\.mavrev\.com|u\.nu|u76\.org|ub0\.cc|ulu\.lu|updating\.me|ur1\.ca|url\.az|url\.co\.uk|url\.ie|url4\.eu|urlborg\.com|urlbrief\.com|urlcover\.com|urlcut\.com|urlenco\.de|urli\.nl|urls\.im|urlshorteningservicefortwitter\.com|urlx\.ie|urlzen\.com|usat\.ly|use\.my|vb\.ly|vgn\.am|virl\.com|vl\.am|vm\.lc|w55c\.net|wapo\.st|wapurl\.co\.uk|wipi\.es|wp\.me|x\.vu|xr\.com|xrl\.in|xrl\.us|xurl\.es|xzb\.cc|yatuc\.com|ye\.pe|yep\.it|yfrog\.com|yhoo\.it|yiyd\.com|youtu\.be|yuarel\.com|z0p\.de|zi\.ma|zi\.mu|zipmyurl\.com|zud\.me|zurl\.ws|zws\.im|zyva\.org)/gi,
      
      // IP addresses (IPv4 and IPv6)
      /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]+)?\b/gi,
      /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/gi,
      
      // Domain patterns without protocol
      /\b[a-z0-9.-]+\.[a-z]{2,}\/[^\s]*/gi,
      
      // Social media handles that might be links
      /@[a-z0-9_]+\.[a-z]{2,}/gi,
      
      // Email addresses (often used to bypass filters)
      /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
      
      // Base64 encoded URLs (common bypass technique)
      /(?:aHR0c|aHR0cHM)[A-Za-z0-9+/=]+/gi,
      
      // URL-like patterns with spaces or special characters (bypass attempts)
      /\b[a-z0-9.-]+\s*\.\s*[a-z]{2,}/gi,
      /\b[a-z0-9.-]+\[dot\][a-z]{2,}/gi,
      /\b[a-z0-9.-]+\(dot\)[a-z]{2,}/gi,
      
      // Common obfuscation patterns
      /h..p[s]?:\/\/[^\s]+/gi,
      /w{3}\.[^\s]+/gi,
    ]

    return enhancedUrlPatterns.some((pattern) => pattern.test(text))
  }

  // <CHANGE> Enhanced content validation with security measures
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
    const specialCharCount = (text.match(/[!@#$%^&*()_+={}\[\]|\\:";'<>?,./]/g) || []).length
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

    // <CHANGE> Enhanced content validation with detailed error messages
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

// ... existing code ...
