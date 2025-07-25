"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Video, VideoOff, Mic, MicOff, PhoneOff, Users, Clock, Shield } from "lucide-react"
import { toast } from "sonner"

interface VideoCallInterfaceProps {
  roomUrl: string
  onSessionEnd: () => void
  sessionDuration: number // in milliseconds
}

export function VideoCallInterface({ roomUrl, onSessionEnd, sessionDuration }: VideoCallInterfaceProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration)
  const [sessionStarted, setSessionStarted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Initialize video call
    initializeCall()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (sessionStarted && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1000) {
            handleEndCall()
            return 0
          }
          return prev - 1000
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [sessionStarted, timeRemaining])

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setIsConnected(true)
      setSessionStarted(true)
      toast.success("Connected to video call!")
    } catch (error) {
      console.error("Error accessing media devices:", error)
      toast.error("Failed to access camera/microphone")
    }
  }

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled)
    // In a real implementation, this would control the video stream
    toast.info(isVideoEnabled ? "Video disabled" : "Video enabled")
  }

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled)
    // In a real implementation, this would control the audio stream
    toast.info(isAudioEnabled ? "Audio muted" : "Audio unmuted")
  }

  const handleEndCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Stop media streams
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }

    onSessionEnd()
    toast.success("Session ended successfully!")
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Session Header */}
      <Card className="bg-gradient-to-r from-red-500/10 to-blue-500/10 border border-red-500/20 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-red-500" />
                <span className="text-xl font-bold">Superman Phone Booth Session</span>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/30">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                LIVE
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">Time Remaining</div>
                <div className="text-2xl font-bold text-red-500">{formatTime(timeRemaining)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Area */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-0 shadow-2xl bg-black">
            <CardContent className="p-0 relative aspect-video">
              {/* User Video */}
              <video
                ref={videoRef}
                autoPlay
                muted
                className={`w-full h-full object-cover ${!isVideoEnabled ? "hidden" : ""}`}
              />

              {/* Video Disabled Overlay */}
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Video is disabled</p>
                  </div>
                </div>
              )}

              {/* Erigga's Video Placeholder */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg border-2 border-white/30 flex items-center justify-center">
                <div className="text-center text-white">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Erigga</p>
                  <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1 animate-pulse" />
                </div>
              </div>

              {/* Session Info Overlay */}
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Session in progress</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls & Info */}
        <div className="space-y-6">
          {/* Call Controls */}
          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Call Controls</h3>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  onClick={toggleVideo}
                  variant={isVideoEnabled ? "default" : "destructive"}
                  className="flex items-center gap-2"
                >
                  {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  {isVideoEnabled ? "Video On" : "Video Off"}
                </Button>

                <Button
                  onClick={toggleAudio}
                  variant={isAudioEnabled ? "default" : "destructive"}
                  className="flex items-center gap-2"
                >
                  {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  {isAudioEnabled ? "Mic On" : "Mic Off"}
                </Button>
              </div>

              <Button
                onClick={handleEndCall}
                variant="destructive"
                className="w-full flex items-center gap-2 bg-red-600 hover:bg-red-700"
              >
                <PhoneOff className="h-4 w-4" />
                End Session
              </Button>
            </CardContent>
          </Card>

          {/* Session Guidelines */}
          <Card className="bg-gradient-to-br from-blue-800/80 to-purple-800/80 backdrop-blur-xl border-blue-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Session Guidelines</h3>

              <div className="space-y-3 text-sm text-blue-100">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <span>Be respectful and professional</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <span>Screenshots are allowed</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <span>Screen recording is prohibited</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <span>Session will auto-end at 20 minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card className="bg-gradient-to-br from-green-800/80 to-emerald-800/80 backdrop-blur-xl border-green-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Connection Status</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-100">Video Quality</span>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">HD</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-100">Audio Quality</span>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Clear</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-100">Connection</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-300 text-sm">Stable</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
