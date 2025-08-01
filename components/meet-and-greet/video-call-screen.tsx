"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PhoneOff, Mic, MicOff, Video, VideoOff, Settings, MessageCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VideoCallScreenProps {
  bookingData: { date: string; time: string; amount: number; bookingId?: string }
  onEndCall: () => void
}

export function VideoCallScreen({ bookingData, onEndCall }: VideoCallScreenProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; message: string; sender: string; timestamp: Date }>
  >([])

  const callFrameRef = useRef<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize Daily.co
    const initializeCall = async () => {
      try {
        // Load Daily.co script
        if (!window.DailyIframe) {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/@daily-co/daily-js"
          script.onload = () => setupCall()
          document.head.appendChild(script)
        } else {
          setupCall()
        }
      } catch (error) {
        console.error("Error initializing call:", error)
        toast({
          title: "Connection Error",
          description: "Failed to initialize video call. Please try again.",
          variant: "destructive",
        })
      }
    }

    const setupCall = async () => {
      try {
        setIsConnecting(true)

        // Create Daily.co room (in production, this should be done on your backend)
        const roomName = `erigga-meet-${bookingData.bookingId || Date.now()}`
        const roomUrl = `https://erigga.daily.co/${roomName}`

        // Create call frame
        callFrameRef.current = window.DailyIframe.createFrame({
          iframeStyle: {
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
            zIndex: 9999,
          },
          showLeaveButton: false,
          showFullscreenButton: true,
        })

        // Set up event listeners
        callFrameRef.current
          .on("joined-meeting", () => {
            setIsConnected(true)
            setIsConnecting(false)
            startCallTimer()
          })
          .on("left-meeting", () => {
            setIsConnected(false)
            onEndCall()
          })
          .on("error", (error: any) => {
            console.error("Daily.co error:", error)
            setIsConnecting(false)
            toast({
              title: "Call Error",
              description: "There was an issue with the video call.",
              variant: "destructive",
            })
          })

        // Join the room
        await callFrameRef.current.join({
          url: roomUrl,
          userName: "Erigga Fan",
        })
      } catch (error) {
        console.error("Error setting up call:", error)
        setIsConnecting(false)
        toast({
          title: "Setup Error",
          description: "Failed to set up video call.",
          variant: "destructive",
        })
      }
    }

    initializeCall()

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy()
      }
    }
  }, [bookingData.bookingId, onEndCall, toast])

  const startCallTimer = () => {
    const startTime = Date.now()
    const timer = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(timer)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleEndCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave()
    }
    onEndCall()
  }

  const toggleMute = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalAudio(!isMuted)
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalVideo(!isVideoOff)
      setIsVideoOff(!isVideoOff)
    }
  }

  const sendChatMessage = () => {
    if (chatMessage.trim() && callFrameRef.current) {
      const newMessage = {
        id: Date.now().toString(),
        message: chatMessage,
        sender: "You",
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, newMessage])

      // Send message through Daily.co
      callFrameRef.current.sendAppMessage({ type: "chat", message: chatMessage }, "*")
      setChatMessage("")
    }
  }

  if (isConnecting) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-white mb-2">Connecting to Erigga...</h2>
            <p className="text-gray-300">Please wait while we establish the connection</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Call Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Call Info */}
          <div className="flex items-center space-x-4 text-white">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg">{formatDuration(callDuration)}</span>
            </div>
            <div className="text-sm opacity-75">Meet & Greet Session</div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-4">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              onClick={toggleMute}
              className="rounded-full w-14 h-14"
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            <Button
              variant={isVideoOff ? "destructive" : "secondary"}
              size="lg"
              onClick={toggleVideo}
              className="rounded-full w-14 h-14"
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowChat(!showChat)}
              className="rounded-full w-14 h-14 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndCall}
              className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="w-7 h-7" />
            </Button>
          </div>

          {/* Settings */}
          <div>
            <Button variant="ghost" size="lg" className="rounded-full w-14 h-14 text-white hover:bg-white/10">
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          className="absolute right-0 top-0 bottom-0 w-80 bg-black/90 backdrop-blur-md border-l border-white/20 z-20"
        >
          <div className="p-4 border-b border-white/20">
            <h3 className="text-white font-semibold">Chat</h3>
          </div>

          <div className="flex-1 p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="bg-white/10 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">{msg.sender}</div>
                <div className="text-white text-sm">{msg.message}</div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-white/20">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm"
              />
              <Button onClick={sendChatMessage} size="sm" className="bg-blue-600 hover:bg-blue-700">
                Send
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-4 left-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-yellow-100">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-sm">Connecting...</span>
          </div>
        </div>
      )}
    </div>
  )
}
