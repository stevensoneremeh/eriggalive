"use client"

import { useState, useEffect, useRef } from "react"
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import CountdownTimer from "./CountdownTimer"

interface VideoCallInterfaceProps {
  sessionData: any
  onCallEnd: () => void
}

export default function VideoCallInterface({ sessionData, onCallEnd }: VideoCallInterfaceProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(20 * 60) // 20 minutes in seconds
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Initialize Daily.co call
    initializeCall()

    return () => {
      // Cleanup call when component unmounts
      endCall()
    }
  }, [])

  const initializeCall = async () => {
    try {
      // In a real implementation, you would initialize Daily.co here
      // For now, we'll simulate the connection
      setTimeout(() => {
        setIsConnected(true)
      }, 2000)
    } catch (error) {
      console.error("Failed to initialize call:", error)
    }
  }

  const endCall = async () => {
    try {
      // Update session status
      await fetch("/api/meet-greet/update-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.id,
          status: "completed",
          endedAt: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error("Failed to update session:", error)
    }

    onCallEnd()
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // In real implementation, mute/unmute the actual call
  }

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff)
    // In real implementation, turn video on/off
  }

  const handleTimeUp = () => {
    // Show thank you message and end call
    setTimeout(() => {
      endCall()
    }, 3000)
  }

  if (timeRemaining <= 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/90 border-slate-700 text-center p-8 max-w-md">
          <CardContent>
            <div className="text-6xl mb-4">🙏</div>
            <h2 className="text-2xl font-bold text-white mb-4">Thank You!</h2>
            <p className="text-gray-300 mb-6">
              Your Meet & Greet session with Erigga has ended. Thank you for your time!
            </p>
            <Button onClick={endCall} className="bg-blue-600 hover:bg-blue-700">
              Return to Platform
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Video Container */}
      <div className="relative h-screen">
        {/* Main Video Area */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black">
          {isConnected ? (
            <div className="w-full h-full flex items-center justify-center">
              {/* Placeholder for Daily.co video */}
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-blue-600 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold">ERIGGA</span>
                  </div>
                  <p className="text-gray-300">Connected to Meet & Greet</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-300">Connecting to Erigga...</p>
              </div>
            </div>
          )}
        </div>

        {/* Timer Overlay */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <CountdownTimer initialTime={timeRemaining} onTimeUp={handleTimeUp} onTimeUpdate={setTimeRemaining} />
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-full px-6 py-4">
            <Button
              onClick={toggleMute}
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-12 h-12"
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <Button
              onClick={toggleVideo}
              variant={isVideoOff ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-12 h-12"
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>

            <Button
              onClick={endCall}
              variant="destructive"
              size="lg"
              className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Session Info */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="text-sm text-gray-300">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Session</span>
            </div>
            <div>with Erigga</div>
          </div>
        </div>
      </div>
    </div>
  )
}
