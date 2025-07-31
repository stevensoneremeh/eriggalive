"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Video, Clock, Users, Mic, Camera, Headphones } from "lucide-react"

interface ConfirmationScreenProps {
  bookingData: { date: string; time: string }
}

export function ConfirmationScreen({ bookingData }: ConfirmationScreenProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const handleJoinCall = () => {
    // This would redirect to the actual video call room
    console.log("Joining call...")
    // window.open('https://your-video-call-platform.com/room/xyz', '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative z-20"
    >
      <Card className="bg-white/90 backdrop-blur-md border-green-200 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold text-green-900">Booking Confirmed!</CardTitle>
          <p className="text-green-600 mt-2">Your spiritual journey awaits</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Booking Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-green-50 p-4 rounded-lg"
          >
            <h3 className="font-semibold text-green-900 mb-3">Your Session</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-green-700">
                  <Clock className="w-4 h-4 mr-2" />
                  Date & Time
                </span>
                <div className="text-right">
                  <div className="font-medium text-green-900">{formatDate(bookingData.date)}</div>
                  <div className="text-sm text-green-600">{formatTime(bookingData.time)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-green-700">
                  <Users className="w-4 h-4 mr-2" />
                  Session Type
                </span>
                <span className="font-medium text-green-900">1-on-1 Spiritual Guidance</span>
              </div>
            </div>
          </motion.div>

          {/* Join Call Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button
              onClick={handleJoinCall}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              <Video className="w-5 h-5 mr-2" />
              Join Call
            </Button>
          </motion.div>

          {/* Setup Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-blue-900">Preparation & Setup</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Camera className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Camera & Lighting</p>
                  <p className="text-sm text-blue-600">Ensure good lighting and a stable camera position</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mic className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Audio Quality</p>
                  <p className="text-sm text-blue-600">Use headphones or find a quiet space</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Headphones className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Mindful Presence</p>
                  <p className="text-sm text-blue-600">Come with an open heart and clear intentions</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Call Etiquette */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-50 p-4 rounded-lg"
          >
            <h3 className="font-semibold text-blue-900 mb-3">Session Etiquette</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Join 2-3 minutes before your scheduled time</li>
              <li>• Maintain a respectful and open demeanor</li>
              <li>• Feel free to share what's on your heart</li>
              <li>• Take notes if something resonates with you</li>
              <li>• End with gratitude and reflection</li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-sm text-blue-600 bg-blue-50 p-3 rounded-lg"
          >
            <p>Need help? Contact support before your session</p>
            <p className="font-medium">🙏 May this journey bring you peace and clarity</p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
