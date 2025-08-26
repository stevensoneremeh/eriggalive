"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Users,
  Heart,
  Target,
  Shield,
  Crown,
  Instagram,
  Youtube,
  Twitter,
  Mail,
  ArrowRight,
  Zap,
  Star,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ImpactInitiative {
  id: string
  title: string
  description: string
  image: string
  quote: string
  beneficiaries: string
  status: "ongoing" | "completed" | "planned"
}

interface EthicsValue {
  id: string
  title: string
  subtitle: string
  description: string
  icon: string
  examples: string[]
}

export default function MissionPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [expandedEthics, setExpandedEthics] = useState<Set<string>>(new Set())
  const [impactCount, setImpactCount] = useState(0)
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const ambientRef = useRef<HTMLAudioElement>(null)

  const impactInitiatives: ImpactInitiative[] = [
    {
      id: "youth-mentorship",
      title: "Warri Youth Mentorship",
      description: "Empowering young talents in the Niger Delta through music and life skills training",
      image: "/images/impact/youth-mentorship.jpg",
      quote: "These kids get talent pass me, dem just need direction",
      beneficiaries: "500+ Youth",
      status: "ongoing",
    },
    {
      id: "flood-relief",
      title: "Delta Flood Relief",
      description: "Emergency support for communities affected by seasonal flooding",
      image: "/images/impact/flood-relief.jpg",
      quote: "When water enter house, na everybody problem be that",
      beneficiaries: "1,200+ Families",
      status: "completed",
    },
    {
      id: "school-support",
      title: "Education Support Program",
      description: "Providing school supplies and scholarships to underprivileged students",
      image: "/images/impact/education.jpg",
      quote: "Education na the only way out of poverty",
      beneficiaries: "300+ Students",
      status: "ongoing",
    },
    {
      id: "music-studio",
      title: "Community Recording Studio",
      description: "Free recording facility for upcoming artists in Warri",
      image: "/images/impact/studio.jpg",
      quote: "Make everybody get chance to record their story",
      beneficiaries: "150+ Artists",
      status: "planned",
    },
  ]

  const ethicsValues: EthicsValue[] = [
    {
      id: "loyalty",
      title: "Loyalty",
      subtitle: "I no dey switch sides",
      description:
        "Real recognize real. I stand by my people through thick and thin. No matter how high I climb, I remember those who held me down when I was nothing.",
      icon: "shield",
      examples: [
        "Never abandon the community that raised me",
        "Support upcoming artists from my area",
        "Keep the same energy with old friends",
        "Represent Delta State everywhere I go",
      ],
    },
    {
      id: "truth",
      title: "Truth",
      subtitle: "I talk am as e be",
      description:
        "No sugar coating, no fake stories. My music reflects real life - the struggles, the pain, the victories. I speak for those who no get voice.",
      icon: "target",
      examples: [
        "Rap about real street experiences",
        "Call out injustice when I see am",
        "No fake lifestyle for social media",
        "Tell the government wetin dey happen for ground",
      ],
    },
    {
      id: "legacy",
      title: "Legacy",
      subtitle: "I dey build for tomorrow",
      description:
        "This no be just about me. Na about the generation wey dey come. I want make my story inspire others to believe say dem fit make am too.",
      icon: "crown",
      examples: [
        "Invest in youth development programs",
        "Create opportunities for upcoming artists",
        "Build institutions that will outlast me",
        "Document the culture for future generations",
      ],
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setImpactCount((prev) => {
        const newCount = prev + Math.floor(Math.random() * 3) + 1
        return newCount > 2500 ? 2500 : newCount
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsVideoPlaying(!isVideoPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleAmbient = () => {
    if (ambientRef.current) {
      if (isAmbientPlaying) {
        ambientRef.current.pause()
      } else {
        ambientRef.current.play()
      }
      setIsAmbientPlaying(!isAmbientPlaying)
    }
  }

  const toggleEthics = (id: string) => {
    const newExpanded = new Set(expandedEthics)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedEthics(newExpanded)
  }

  const scrollToMembership = () => {
    document.getElementById("membership-section")?.scrollIntoView({
      behavior: "smooth",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "completed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "planned":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "shield":
        return <Shield className="w-8 h-8" />
      case "target":
        return <Target className="w-8 h-8" />
      case "crown":
        return <Crown className="w-8 h-8" />
      default:
        return <Star className="w-8 h-8" />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <audio ref={ambientRef} loop preload="auto" className="hidden">
        <source src="/audio/warri-street-ambient.mp3" type="audio/mpeg" />
      </audio>

      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video ref={videoRef} autoPlay muted={isMuted} loop playsInline className="w-full h-full object-cover">
            <source src="/videos/erigga-warri-streets.mp4" type="video/mp4" />
            {/* Fallback image */}
            <div className="w-full h-full bg-gradient-to-br from-red-900 via-black to-yellow-900" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>

        {/* Video Controls */}
        <div className="absolute top-6 right-6 z-20 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVideoPlayback}
            className="bg-black/50 hover:bg-black/70 text-white border border-red-500/30"
          >
            {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="bg-black/50 hover:bg-black/70 text-white border border-red-500/30"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAmbient}
            className={cn(
              "bg-black/50 hover:bg-black/70 text-white border border-red-500/30",
              isAmbientPlaying && "bg-red-500/20 border-red-500",
            )}
          >
            <Volume2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 z-10 relative text-center">
          <div className="space-y-8">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-yellow-600 text-black font-bold text-sm mb-8">
              <MapPin className="h-4 w-4 mr-2" />
              WARRI TO THE WORLD
              <div className="w-2 h-2 rounded-full bg-black animate-pulse ml-3"></div>
            </div>

            <h1 className="text-6xl md:text-8xl font-black leading-tight">
              <span className="block text-red-500">NO BE BY CHARTS.</span>
              <span className="block text-yellow-500">NA BY IMPACT.</span>
            </h1>

            <p className="text-2xl md:text-3xl font-bold text-gray-300 max-w-2xl mx-auto">
              This no be music. Na movement.
            </p>

            <Button
              onClick={scrollToMembership}
              size="lg"
              className="bg-gradient-to-r from-red-600 to-yellow-600 text-black hover:from-red-700 hover:to-yellow-700 font-bold text-lg px-8 py-4 rounded-full"
            >
              Join the Movement
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-red-500" />
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-black via-gray-900 to-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.1)_0%,transparent_50%)]"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Portrait */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-yellow-500/20 rounded-2xl blur-3xl"></div>
              <img
                src="/images/erigga-portrait-gritty.jpg"
                alt="Erigga - The Voice of the Streets"
                className="relative w-full h-[600px] object-cover rounded-2xl border border-red-500/20 filter grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>

            {/* Narrative Text */}
            <div className="space-y-8">
              <blockquote className="text-4xl md:text-5xl font-black text-red-500 leading-tight">
                "I dey rap truth. I dey live am. I dey give back."
              </blockquote>

              <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
                <p>
                  I come from where dreams dey struggle to breathe. Where hope dey fight with reality every single day.
                  But I no just wan blow—I wan build.
                </p>
                <p>
                  This platform na for the real ones. The ones wey dey hustle with heart. The ones wey understand say
                  success without impact na just noise.
                </p>
                <p>
                  From Warri streets to your speakers, I carry the voice of my people. Every bar, every beat, every
                  breath—na for the culture, for the community, for the future.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-black" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">Families Impacted</div>
                  <div className="text-3xl font-black text-red-500">{impactCount.toLocaleString()}+</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-black via-red-950/20 to-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">REAL IMPACT, REAL CHANGE</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Actions speak louder than lyrics. See how we dey change lives for real.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {impactInitiatives.map((initiative) => (
              <Card
                key={initiative.id}
                className="bg-gray-900/50 border-red-500/20 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 group cursor-pointer overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={initiative.image || "/placeholder.svg?height=200&width=400"}
                    alt={initiative.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <Badge className={cn("absolute top-4 right-4", getStatusColor(initiative.status))}>
                    {initiative.status}
                  </Badge>
                </div>

                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                    {initiative.title}
                  </h3>

                  <p className="text-gray-400 text-sm leading-relaxed">{initiative.description}</p>

                  <blockquote className="text-red-400 italic text-sm border-l-2 border-red-500/30 pl-3">
                    "{initiative.quote}"
                  </blockquote>

                  <div className="flex items-center justify-between">
                    <span className="text-yellow-400 font-semibold text-sm">{initiative.beneficiaries}</span>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-black via-gray-900 to-black relative">
        <div className="absolute inset-0 bg-[url('/images/concrete-texture.jpg')] opacity-5"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">THE CODE I LIVE BY</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              These no be just words. Na principles wey guide every move I make.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {ethicsValues.map((value) => (
              <Card key={value.id} className="bg-gray-900/30 border-red-500/20 backdrop-blur-sm overflow-hidden">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-800/30 transition-colors"
                  onClick={() => toggleEthics(value.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                        {getIcon(value.icon)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{value.title}</h3>
                        <p className="text-red-400 font-semibold">{value.subtitle}</p>
                      </div>
                    </div>
                    {expandedEthics.has(value.id) ? (
                      <ChevronUp className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedEthics.has(value.id) && (
                  <div className="px-6 pb-6 space-y-6 border-t border-red-500/20">
                    <p className="text-gray-300 leading-relaxed text-lg">{value.description}</p>

                    <div>
                      <h4 className="text-yellow-400 font-semibold mb-3">How I Live This:</h4>
                      <ul className="space-y-2">
                        {value.examples.map((example, index) => (
                          <li key={index} className="flex items-start gap-3 text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="membership-section" className="py-24 bg-gradient-to-b from-black via-red-950/30 to-black">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-12">
            <blockquote className="text-4xl md:text-6xl font-black text-white leading-tight">
              "If you dey feel this, you don already belong."
            </blockquote>

            <div className="space-y-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-red-600 to-yellow-600 text-black hover:from-red-700 hover:to-yellow-700 font-bold text-xl px-12 py-6 rounded-full"
                onClick={() => {
                  if (user) {
                    toast({
                      title: "Welcome to the Movement! 🔥",
                      description: "You're already part of the family. Keep supporting the culture!",
                    })
                  } else {
                    window.location.href = "/signup"
                  }
                }}
              >
                <Users className="w-6 h-6 mr-3" />
                Become a Member
              </Button>

              <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                    <Zap className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Early Access to Drops</h3>
                  <p className="text-gray-400 text-sm">Be the first to hear new music and exclusive content</p>
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
                    <Heart className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Behind-the-Scenes Content</h3>
                  <p className="text-gray-400 text-sm">See the real story behind the music and the movement</p>
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                    <Target className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Community Impact Updates</h3>
                  <p className="text-gray-400 text-sm">Track how your support is changing lives in real time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16 bg-black border-t border-red-500/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-black text-white">Stay Connected to the Movement</h3>

              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-gray-900 hover:bg-red-600 text-white border border-red-500/20"
                  onClick={() => window.open("https://instagram.com/erigga", "_blank")}
                >
                  <Instagram className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-gray-900 hover:bg-red-600 text-white border border-red-500/20"
                  onClick={() => window.open("https://youtube.com/@erigga", "_blank")}
                >
                  <Youtube className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-gray-900 hover:bg-red-600 text-white border border-red-500/20"
                  onClick={() => window.open("https://twitter.com/erigga", "_blank")}
                >
                  <Twitter className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex gap-4">
                <input
                  type="email"
                  placeholder="Enter your email for updates"
                  className="flex-1 px-4 py-3 bg-gray-900 border border-red-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
                <Button className="bg-red-600 hover:bg-red-700 text-white px-6">
                  <Mail className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
              </div>
            </div>

            <div className="text-center md:text-right">
              <blockquote className="text-2xl md:text-3xl font-black text-red-500 leading-tight">
                "Na legacy we dey build. No be hype."
              </blockquote>
              <p className="text-gray-400 mt-4">- Erigga, The Paperboi</p>
            </div>
          </div>

          <div className="border-t border-red-500/20 mt-12 pt-8 text-center">
            <p className="text-gray-500">© 2025 Erigga Live. Built for the culture, by the culture.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
