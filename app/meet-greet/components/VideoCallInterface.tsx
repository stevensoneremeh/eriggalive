"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CountdownTimer } from "./CountdownTimer"
import { Video, VideoOff, Mic, MicOff, PhoneOff, Settings, Maximize } from "lucide-react"

interface VideoCallInterfaceProps {
  onSessionEnd: () => void
  sessionDuration: number // in seconds
}

export function VideoCallInterface({ onSessionEnd, sessionDuration }: VideoCallInterfaceProps) {
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Simulate connection after 3 seconds
    const connectTimer = setTimeout(() => {
      setIsConnected(true)
    }, 3000)

    // Start the session timer
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleEndSession()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Auto-hide controls after 5 seconds
    const controlsTimer = setTimeout(() => {
      setShowControls(false)
    }, 5000)

    return () => {
      clearTimeout(connectTimer)
      clearInterval(timer)
      clearTimeout(controlsTimer)
    }
  }, [])

  const handleEndSession = () => {
    // Show thank you message with fadeout
    const thankYouDiv = document.createElement("div")
    thankYouDiv.className = "fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in"
    thankYouDiv.innerHTML = `
      <div class="text-center text-white space-y-4">
        <h2 class="text-4xl font-bold">Thank You!</h2>
        <p class="text-xl">Your session with Erigga has ended.</p>
        <p class="text-lg opacity-75">We hope you enjoyed your exclusive meet & greet!</p>
      </div>
    `
    document.body.appendChild(thankYouDiv)

    setTimeout(() => {
      document.body.removeChild(thankYouDiv)
      onSessionEnd()
    }, 3000)
  }

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn)
  }

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn)
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header with Timer */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-400 animate-pulse" : "bg-yellow-400 animate-bounce"
              }`}
            />
            <span className="text-white font-medium">{isConnected ? "Connected with Erigga" : "Connecting..."}</span>
          </div>
        </div>

        <CountdownTimer timeRemaining={timeRemaining} totalDuration={sessionDuration} />
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (Erigga's video) */}
        <div className="absolute inset-0">
          {isConnected ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center">
              {/* Simulated remote video */}
              <div className="text-center text-white space-y-4">
                <div className="w-32 h-32 rounded-full border-4 border-blue-400 overflow-hidden mx-auto">
                  <img src="/images/hero/erigga1.jpeg" alt="Erigga" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Erigga</h3>
                  <p className="text-blue-300">Live from the studio</p>
                </div>
                {/* Simulated audio waves */}
                <div className="flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-green-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 20 + 10}px`,
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
              <div className="text-center text-white space-y-4">
                <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xl">Connecting to Erigga...</p>
                <p className="text-slate-400">Please wait while we establish the connection</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (User's video) - Picture in Picture */}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-slate-800 rounded-lg border-2 border-slate-600 overflow-hidden">
          {isVideoOn ? (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 rounded-full bg-slate-600 flex items-center justify-center mx-auto mb-2">
                  <Video className="h-8 w-8" />
                </div>
                <p className="text-sm">You</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
              <VideoOff className="h-8 w-8 text-slate-400" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent transition-all duration-300 ${
          showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        onMouseEnter={() => setShowControls(true)}
      >
        <div className="flex items-center justify-center gap-4">
          {/* Audio Toggle */}
          <Button
            onClick={toggleAudio}
            size="lg"
            variant={isAudioOn ? "default" : "destructive"}
            className="rounded-full w-14 h-14"
          >
            {isAudioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>

          {/* Video Toggle */}
          <Button
            onClick={toggleVideo}
            size="lg"
            variant={isVideoOn ? "default" : "destructive"}
            className="rounded-full w-14 h-14"
          >
            {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>

          {/* End Call */}
          <Button
            onClick={handleEndSession}
            size="lg"
            variant="destructive"
            className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-8 w-8" />
          </Button>

          {/* Settings */}
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-14 h-14 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Settings className="h-6 w-6" />
          </Button>

          {/* Fullscreen */}
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-14 h-14 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Maximize className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Show controls on mouse move */}
      <div
        className="absolute inset-0 z-10"
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => {
          setTimeout(() => setShowControls(false), 3000)
        }}
      />
    </div>
  )
}
