"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Calendar, Clock, Video, Headphones, Wifi, Heart } from "lucide-react"

interface ConfirmationScreenProps {
  bookingData: { date: string; time: string }
}

export function ConfirmationScreen({ bookingData }: ConfirmationScreenProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
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
    // This would typically open the video call platform
    window.open("https://meet.google.com/placeholder-room", "_blank")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative z-20"
    >
      <Card className="bg-white/90 backdrop-blur-md border-green-200/50 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
            Booking Confirmed!
          </CardTitle>
          <p className="text-green-600/70 text-sm">Your spiritual session has been successfully booked</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Session Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-green-50/50 rounded-lg p-4 space-y-3"
          >
            <h3 className="font-semibold text-green-800 mb-3">Session Details</h3>
            <div className="flex items-center text-sm text-green-700">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{formatDate(bookingData.date)}</span>
            </div>
            <div className="flex items-center text-sm text-green-700">
              <Clock className="w-4 h-4 mr-2" />
              <span>{formatTime(bookingData.time)} (30 minutes)</span>
            </div>
          </motion.div>

          {/* Join Call Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button
              onClick={handleJoinCall}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Video className="w-5 h-5 mr-2" />
              Join Call (Available 5 minutes before)
            </Button>
          </motion.div>

          {/* Preparation Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-blue-800">Preparation & Setup</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start space-x-3 p-3 bg-blue-50/50 rounded-lg">
                <Wifi className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Stable Internet</p>
                  <p className="text-xs text-blue-600">Ensure you have a reliable internet connection</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50/50 rounded-lg">
                <Headphones className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Audio Setup</p>
                  <p className="text-xs text-blue-600">Test your microphone and speakers beforehand</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50/50 rounded-lg">
                <Heart className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Quiet Space</p>
                  <p className="text-xs text-blue-600">Find a peaceful environment for your session</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Etiquette Guidelines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <h3 className="font-semibold text-purple-800">Session Etiquette</h3>
            <div className="bg-purple-50/50 rounded-lg p-4 space-y-2">
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Join the call 2-3 minutes early</li>
                <li>• Keep your microphone muted when not speaking</li>
                <li>• Maintain a respectful and open mindset</li>
                <li>• Feel free to ask questions during the session</li>
                <li>• Take notes if something resonates with you</li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-xs text-gray-600"
          >
            You'll receive an email confirmation with the meeting link shortly
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
