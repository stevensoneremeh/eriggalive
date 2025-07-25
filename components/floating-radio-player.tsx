"use client"
import { Heart, Zap, Target, Eye, Briefcase, MapPin } from "lucide-react"
import { useRadio } from "@/contexts/radio-context"
import { EriggaRadio } from "@/components/erigga-radio"

const MOOD_ICONS = {
  hustle: Briefcase,
  street: MapPin,
  love: Heart,
  pain: Target,
  victory: Zap,
  reality: Eye,
}

const MOOD_COLORS = {
  hustle: "from-green-500 to-emerald-600",
  street: "from-red-500 to-orange-600",
  love: "from-pink-500 to-rose-600",
  pain: "from-purple-500 to-indigo-600",
  victory: "from-yellow-500 to-amber-600",
  reality: "from-blue-500 to-cyan-600",
}

const MOOD_EMBEDS = {
  hustle: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  street: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  love: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  pain: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  victory: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  reality: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
}

export function FloatingRadioPlayer() {
  const { currentMood } = useRadio()

  // Only show the radio player if a mood is selected or if we want it always visible
  return <EriggaRadio />
}
