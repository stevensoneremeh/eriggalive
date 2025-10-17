"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Music, MapPin, Heart, Radio, Users } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

interface SurveyData {
  location: string
  favoriteSong: string
  hopedSong: string
  hearAbout: string
  specialRequests: string
}

export default function EventSurveyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get("event")

  const [surveyData, setSurveyData] = useState<SurveyData>({
    location: "",
    favoriteSong: "",
    hopedSong: "",
    hearAbout: "",
    specialRequests: "",
  })

  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: keyof SurveyData, value: string) => {
    setSurveyData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Store survey data in localStorage temporarily
      localStorage.setItem("eventSurveyData", JSON.stringify(surveyData))

      // Redirect to payment page
      router.push(`/events/payment?event=${eventId}`)
    } catch (error) {
      console.error("Error submitting survey:", error)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = surveyData.location && surveyData.favoriteSong && surveyData.hopedSong && surveyData.hearAbout

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-red-900/20" />
      <div className="absolute inset-0 bg-[url('/placeholder-kzlwg.png')] opacity-10 bg-cover bg-center" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/events"
            className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Event
          </Link>

          <motion.h1
            className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textShadow: "0 0 30px rgba(239, 68, 68, 0.5)",
              fontFamily: "Impact, Arial Black, sans-serif",
            }}
          >
            BEFORE WE PROCEED
          </motion.h1>
          <motion.p
            className="text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Help us make this experience unforgettable for you
          </motion.p>
        </div>

        {/* Survey Form */}
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/30 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-white">Tell Us About Yourself</CardTitle>
            </CardHeader>

            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-400" />
                    Where are you coming from?
                  </Label>
                  <Input
                    id="location"
                    value={surveyData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g., Lagos, Abuja, Port Harcourt..."
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-red-500"
                    required
                  />
                </div>

                {/* Favorite Song */}
                <div className="space-y-2">
                  <Label htmlFor="favoriteSong" className="text-white font-semibold flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-400" />
                    What's your favorite Erigga song?
                  </Label>
                  <Input
                    id="favoriteSong"
                    value={surveyData.favoriteSong}
                    onChange={(e) => handleInputChange("favoriteSong", e.target.value)}
                    placeholder="e.g., Paper Boi, Motivation, Area to the World..."
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-red-500"
                    required
                  />
                </div>

                {/* Hoped Song */}
                <div className="space-y-2">
                  <Label htmlFor="hopedSong" className="text-white font-semibold flex items-center gap-2">
                    <Music className="h-4 w-4 text-yellow-400" />
                    What song are you hoping Erigga performs at the event?
                  </Label>
                  <Input
                    id="hopedSong"
                    value={surveyData.hopedSong}
                    onChange={(e) => handleInputChange("hopedSong", e.target.value)}
                    placeholder="e.g., The Erigma, Kettle, Welcome to Warri..."
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-red-500"
                    required
                  />
                </div>

                {/* How did you hear about this */}
                <div className="space-y-2">
                  <Label htmlFor="hearAbout" className="text-white font-semibold flex items-center gap-2">
                    <Radio className="h-4 w-4 text-blue-400" />
                    How did you hear about this event?
                  </Label>
                  <Select value={surveyData.hearAbout} onValueChange={(value) => handleInputChange("hearAbout", value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="radio">Radio</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Special Requests */}
                <div className="space-y-2">
                  <Label htmlFor="specialRequests" className="text-white font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-400" />
                    Any special requests or shout-outs? (Optional)
                  </Label>
                  <Textarea
                    id="specialRequests"
                    value={surveyData.specialRequests}
                    onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                    placeholder="Let us know if you have any special requests or want to send a shout-out..."
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-red-500 min-h-[100px]"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    disabled={!isFormValid || loading}
                    className="w-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 hover:from-red-700 hover:via-orange-600 hover:to-yellow-600 text-white font-black text-lg py-6 rounded-xl shadow-2xl hover:shadow-red-500/30 transition-all duration-300 disabled:opacity-50"
                    style={{
                      boxShadow: "0 0 30px rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    {loading ? "Processing..." : "PROCEED TO PAYMENT"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
