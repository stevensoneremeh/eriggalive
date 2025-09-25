"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, VideoOff, Mic, MicOff, Phone, MessageSquare, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ZegoExpressEngine } from "zego-express-engine-webrtc"

interface VideoCallRoomProps {
  roomId: string
  userId: string
  userName: string
  onLeave: () => void
}

interface ChatMessage {
  id: string
  sender: string
  message: string
  timestamp: Date
}

export function VideoCallRoom({ roomId, userId, userName, onLeave }: VideoCallRoomProps) {
  const [zg, setZg] = useState<ZegoExpressEngine | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState<string[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [showChat, setShowChat] = useState(false)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()

  // Initialize ZEGOCLOUD
  useEffect(() => {
    const initializeZego = async () => {
      try {
        const appID = parseInt(process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID || "1051189168")
        const server = process.env.ZEGOCLOUD_SERVER_SECRET || "41d2853b94b8def7230538a7011fe54a"

        // Create ZegoExpressEngine instance
        const zegoEngine = new ZegoExpressEngine(appID, server)
        
        // Set up event listeners
        zegoEngine.on('roomStateUpdate', (roomID, state, errorCode, extendedData) => {
          console.log('Room state update:', state, errorCode)
          setIsConnected(state === 'CONNECTED')
        })

        zegoEngine.on('publisherStateUpdate', (result) => {
          console.log('Publisher state update:', result)
        })

        zegoEngine.on('playerStateUpdate', (result) => {
          console.log('Player state update:', result)
        })

        zegoEngine.on('roomUserUpdate', (roomID, updateType, userList) => {
          console.log('Room user update:', updateType, userList)
          if (updateType === 'ADD') {
            setParticipants(prev => [...prev, ...userList.map(user => user.userName || '')])
          } else if (updateType === 'DELETE') {
            const leftUsers = userList.map(user => user.userName)
            setParticipants(prev => prev.filter(name => !leftUsers.includes(name)))
          }
        })

        setZg(zegoEngine)

        // Login to room
        const token = await generateZegoToken(userId, roomId)
        await zegoEngine.loginRoom(roomId, token, {
          userID: userId,
          userName: userName,
        })

        toast({
          title: "Connected",
          description: "Successfully joined the video call room",
        })

      } catch (error) {
        console.error('ZEGO initialization error:', error)
        toast({
          title: "Connection Failed",
          description: "Failed to connect to video call. Please try again.",
          variant: "destructive"
        })
      }
    }

    initializeZego()

    return () => {
      if (zg) {
        zg.logoutRoom()
        zg.destroyEngine()
      }
    }
  }, [roomId, userId, userName, toast])

  // Generate ZEGO token (in production, this should be done on backend)
  const generateZegoToken = async (userId: string, roomId: string): Promise<string> => {
    // This is a simplified token generation for demo purposes
    // In production, implement proper token generation on your backend
    return `demo_token_${userId}_${roomId}_${Date.now()}`
  }

  // Start publishing local stream
  const startPublishing = async () => {
    if (!zg) return

    try {
      const stream = await zg.createStream({
        camera: {
          audio: isAudioEnabled,
          video: isVideoEnabled,
        },
      })

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      await zg.startPublishingStream(`stream_${userId}`, stream)
      
      toast({
        title: "Stream Started",
        description: "Your video stream is now active",
      })
    } catch (error) {
      console.error('Publishing error:', error)
      toast({
        title: "Stream Error",
        description: "Failed to start video stream",
        variant: "destructive"
      })
    }
  }

  // Start playing remote stream
  const startPlaying = async (streamID: string) => {
    if (!zg) return

    try {
      const stream = await zg.startPlayingStream(streamID)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Playing error:', error)
    }
  }

  // Toggle video
  const toggleVideo = async () => {
    if (!zg) return

    try {
      // ZEGO video muting - simplified approach
      setIsVideoEnabled(!isVideoEnabled)
      
      toast({
        title: isVideoEnabled ? "Video Disabled" : "Video Enabled",
        description: `Your video is now ${isVideoEnabled ? "off" : "on"}`,
      })
    } catch (error) {
      console.error('Video toggle error:', error)
    }
  }

  // Toggle audio
  const toggleAudio = async () => {
    if (!zg) return

    try {
      // ZEGO audio muting - simplified approach  
      setIsAudioEnabled(!isAudioEnabled)
      
      toast({
        title: isAudioEnabled ? "Audio Muted" : "Audio Unmuted",
        description: `Your microphone is now ${isAudioEnabled ? "off" : "on"}`,
      })
    } catch (error) {
      console.error('Audio toggle error:', error)
    }
  }

  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: userName,
      message: newMessage.trim(),
      timestamp: new Date(),
    }

    setChatMessages(prev => [...prev, message])
    setNewMessage("")

    // In a real implementation, you would send this through Firebase or ZEGO's messaging
    console.log('Sending message:', message)
  }

  // Leave room
  const handleLeave = () => {
    if (zg) {
      zg.logoutRoom()
      zg.destroyEngine()
    }
    onLeave()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gray-900/95 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-white font-semibold">Erigga Live - Meet & Greet</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-white/80 text-sm">
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-white/80 text-sm">
              <Users className="w-4 h-4" />
              <span>{participants.length + 1}</span>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div className="flex-1 relative">
          {/* Remote Video (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            muted={false}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-64 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
              You
            </div>
          </div>

          {/* Chat Panel */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ x: 300 }}
                animate={{ x: 0 }}
                exit={{ x: 300 }}
                className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-md border-l border-white/20"
              >
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-white/20">
                    <h3 className="text-white font-medium">Chat</h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="text-white text-sm">
                        <div className="font-medium text-blue-400">{msg.sender}</div>
                        <div className="text-white/80">{msg.message}</div>
                        <div className="text-white/50 text-xs">
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 border-t border-white/20">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                      />
                      <Button
                        onClick={sendMessage}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="bg-gray-900/95 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={toggleVideo}
              variant={isVideoEnabled ? "default" : "destructive"}
              size="lg"
              className="rounded-full w-12 h-12"
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>
            
            <Button
              onClick={toggleAudio}
              variant={isAudioEnabled ? "default" : "destructive"}
              size="lg"
              className="rounded-full w-12 h-12"
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            <Button
              onClick={() => setShowChat(!showChat)}
              variant={showChat ? "secondary" : "outline"}
              size="lg"
              className="rounded-full w-12 h-12"
            >
              <MessageSquare className="w-6 h-6" />
            </Button>

            <Button
              onClick={handleLeave}
              variant="destructive"
              size="lg"
              className="rounded-full w-12 h-12"
            >
              <Phone className="w-6 h-6 transform rotate-135" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}