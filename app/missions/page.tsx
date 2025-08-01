"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Phone, Star, Zap, Crown, Users, MessageCircle } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"

export default function MissionsPage() {
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const { profile } = useAuth()

  // Generate next 14 days
  const generateDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push({
        value: date.toISOString().split("T")[0],
        label: date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
      })
    }
    return dates
  }

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        slots.push({ value: time, label: displayTime })
      }
    }
    return slots
  }

  const dates = generateDates()
  const timeSlots = generateTimeSlots()

  const handleBooking = () => {
    if (selectedDate && selectedTime) {
      // Handle booking logic here
      console.log("Booking:", { date: selectedDate, time: selectedTime })
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                Phone Booth Missions
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Step into the mystical phone booth and connect with wisdom through our exclusive sessions
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Phone Booth 3D Scene */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative w-full max-w-md mx-auto">
                {/* 3D Phone Booth */}
                <div className="relative perspective-1000">
                  <motion.div
                    className="relative transform-gpu"
                    animate={{
                      rotateY: [0, 5, 0, -5, 0],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    {/* Phone Booth Structure */}
                    <div className="relative w-80 h-96 mx-auto">
                      {/* Back Panel */}
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-blue-800 rounded-lg shadow-2xl transform translate-z-[-20px]" />

                      {/* Side Panels */}
                      <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-blue-800 to-blue-700 rounded-l-lg transform-gpu origin-left skew-y-2" />
                      <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-blue-800 to-blue-700 rounded-r-lg transform-gpu origin-right skew-y-2" />

                      {/* Front Panel */}
                      <div className="absolute inset-2 bg-gradient-to-b from-blue-700 to-blue-600 rounded-lg shadow-inner">
                        {/* Glass Effect */}
                        <div className="absolute inset-4 bg-gradient-to-b from-cyan-200/20 to-blue-300/30 rounded-lg backdrop-blur-sm border border-white/20">
                          {/* Interior Glow */}
                          <div className="absolute inset-0 bg-gradient-radial from-cyan-400/30 via-blue-500/20 to-transparent rounded-lg" />

                          {/* Phone */}
                          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                            <motion.div
                              animate={{
                                scale: [1, 1.05, 1],
                                rotate: [0, 2, 0, -2, 0],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                              }}
                              className="w-8 h-12 bg-gradient-to-b from-gray-800 to-gray-900 rounded-sm shadow-lg"
                            >
                              <div className="w-full h-2 bg-gray-700 rounded-t-sm" />
                              <div className="w-6 h-6 bg-gray-600 rounded-full mx-auto mt-2" />
                            </motion.div>
                          </div>

                          {/* Mystical Particles */}
                          {[...Array(6)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-60"
                              animate={{
                                x: [0, Math.random() * 100 - 50],
                                y: [0, Math.random() * 100 - 50],
                                opacity: [0.6, 0, 0.6],
                                scale: [0.5, 1, 0.5],
                              }}
                              transition={{
                                duration: 4 + Math.random() * 2,
                                repeat: Number.POSITIVE_INFINITY,
                                delay: i * 0.5,
                              }}
                              style={{
                                left: `${20 + Math.random() * 60}%`,
                                top: `${20 + Math.random() * 60}%`,
                              }}
                            />
                          ))}
                        </div>

                        {/* Door Handle */}
                        <div className="absolute right-2 top-1/2 w-2 h-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full shadow-md" />

                        {/* Top Light */}
                        <motion.div
                          className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full"
                          animate={{
                            opacity: [0.7, 1, 0.7],
                            boxShadow: [
                              "0 0 10px rgba(255, 255, 0, 0.3)",
                              "0 0 20px rgba(255, 255, 0, 0.6)",
                              "0 0 10px rgba(255, 255, 0, 0.3)",
                            ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                        />
                      </div>

                      {/* Base */}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-84 h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-lg shadow-lg" />
                    </div>
                  </motion.div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-8 -right-8">
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Star className="w-6 h-6 text-white" />
                  </motion.div>
                </div>

                <div className="absolute -bottom-4 -left-8">
                  <motion.div
                    animate={{
                      y: [0, 10, 0],
                      x: [0, 5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Zap className="w-4 h-4 text-white" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Booking Section */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              {/* User Info */}
              {profile && (
                <Card className="bg-white/90 backdrop-blur-md border-purple-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Crown className="w-5 h-5 mr-2 text-purple-600" />
                      Welcome, {profile.full_name || profile.username}
                    </CardTitle>
                    <CardDescription>
                      Your current tier: <Badge className="ml-2">{profile.tier}</Badge>
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {/* Mission Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300">
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-800">1,247</div>
                    <div className="text-sm text-purple-600">Sessions Completed</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300">
                  <CardContent className="p-4 text-center">
                    <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-800">4.9</div>
                    <div className="text-sm text-blue-600">Average Rating</div>
                  </CardContent>
                </Card>
              </div>

              {/* Booking Form */}
              <Card className="bg-white/90 backdrop-blur-md border-blue-200 shadow-2xl">
                <CardHeader className="text-center pb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="mx-auto mb-4 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center"
                  >
                    <Phone className="w-8 h-8 text-white" />
                  </motion.div>
                  <CardTitle className="text-2xl font-bold text-blue-900">Schedule Your Session</CardTitle>
                  <CardDescription className="text-blue-600 mt-2">
                    Connect with wisdom through our mystical phone booth
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-blue-900">
                        <Calendar className="w-4 h-4 mr-2" />
                        Select Date
                      </label>
                      <Select value={selectedDate} onValueChange={setSelectedDate}>
                        <SelectTrigger className="w-full border-blue-200 focus:border-blue-400">
                          <SelectValue placeholder="Choose a date" />
                        </SelectTrigger>
                        <SelectContent>
                          {dates.map((date) => (
                            <SelectItem key={date.value} value={date.value}>
                              {date.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-blue-900">
                        <Clock className="w-4 h-4 mr-2" />
                        Select Time
                      </label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger className="w-full border-blue-200 focus:border-blue-400">
                          <SelectValue placeholder="Choose a time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Button
                        onClick={handleBooking}
                        disabled={!selectedDate || !selectedTime}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        Begin Journey
                      </Button>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-center text-sm text-blue-600 bg-blue-50 p-3 rounded-lg"
                  >
                    <p>✨ Each session is a unique spiritual experience</p>
                    <p>🕊️ Find peace and guidance in our sacred space</p>
                  </motion.div>
                </CardContent>
              </Card>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-800">One-on-One Sessions</h3>
                        <p className="text-sm text-green-600">Personal guidance and wisdom</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-yellow-800">Mystical Experience</h3>
                        <p className="text-sm text-yellow-600">Connect with higher wisdom</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
