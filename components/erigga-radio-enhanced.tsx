"use client"

import { useState, useEffect, useRef } from "react"
import { Volume2, VolumeX, Pause, Play, X, Settings, Radio, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EriggaRadioProps {
  className?: string
}

const sampleMessages = [
  "🎵 Welcome to Erigga Radio - Your home for the hottest beats",
  "🔥 Paper Boi in the building with that street wisdom",
  "💯 From Warri to the world - we keep it real",
  "🎤 Erigga Live bringing you exclusive content 24/7",
  "⚡ The movement never stops - join the community",
  "🌟 New music, behind the scenes, and more coming soon",
  "🎶 This is your soundtrack to the streets",
  "📻 Broadcasting live from the heart of Warri",
  "🎯 Real music for real people - no cap",
  "🔊 Turn up the volume and feel the vibe",
]

export function EriggaRadioEnhanced({ className }: EriggaRadioProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAnimationPaused, setIsAnimationPaused] = useState(false)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [audioLoaded, setAudioLoaded] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [volume, setVolume] = useState(0.7)

  const audioRef = useRef<HTMLAudioElement>(null)
  const messageIntervalRef = useRef<NodeJS.Timeout>()

  // Initialize audio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleCanPlay = () => {
      setAudioLoaded(true)
      audio.volume = volume
      // Auto-start playing (muted for browser compliance)
      audio.play().catch(console.error)
      setIsPlaying(true)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      // Loop the audio
      audio.currentTime = 0
      audio.play().catch(console.error)
      setIsPlaying(true)
    }

    const handleError = () => {
      setAudioLoaded(false)
      setIsPlaying(false)
    }

    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [volume])

  // Message rotation
  useEffect(() => {
    if (!audioLoaded || !isPlaying) {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current)
      }
      return
    }

    messageIntervalRef.current = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % sampleMessages.length)
    }, 5000) // Change message every 5 seconds

    return () => {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current)
      }
    }
  }, [audioLoaded, isPlaying])

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    audio.muted = newMutedState
  }

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(console.error)
      setIsPlaying(true)
    }
  }

  const toggleAnimation = () => {
    setIsAnimationPaused(!isAnimationPaused)
  }

  const hideRadio = () => {
    setIsVisible(false)
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      setIsPlaying(false)
    }
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",
        "hover:scale-105 group",
        className,
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Audio Element */}
      <audio ref={audioRef} src="/audio/erigga-radio-sample.mp3" muted={isMuted} loop preload="auto" />

      {/* Main Radio Container */}
      <div
        className={cn(
          "relative bg-gradient-to-br from-gray-900 via-gray-800 to-black",
          "rounded-2xl shadow-2xl border border-gray-700",
          "transition-all duration-300",
          isExpanded ? "p-4" : "p-2",
        )}
      >
        {/* Radio Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "relative w-8 h-8 md:w-10 md:h-10 rounded-full",
                "bg-gradient-to-r from-red-500 to-orange-500",
                "flex items-center justify-center",
                isPlaying && !isAnimationPaused && "animate-pulse",
              )}
            >
              <Radio className="w-4 h-4 md:w-5 md:h-5 text-white" />
              {/* Live indicator */}
              <div
                className={cn(
                  "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                  isPlaying && !isMuted ? "bg-green-500 animate-pulse" : "bg-red-500",
                )}
              />
            </div>
            <div className="text-white">
              <div className="text-xs font-bold">ERIGGA RADIO</div>
              <div className="text-xs text-gray-300">Live 24/7</div>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            onClick={toggleExpanded}
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>

        {/* Radio GIF/Visual */}
        <div className="flex items-center justify-center mb-3">
          <div
            className={cn(
              "relative w-16 h-16 md:w-20 md:h-20 transition-all duration-300",
              isAnimationPaused && "animate-pulse",
              !isAnimationPaused && isPlaying && "animate-bounce",
            )}
          >
            <img
              src="/images/radio-man.gif"
              alt="Erigga Radio"
              className={cn("w-full h-full object-contain rounded-lg shadow-lg", isAnimationPaused && "grayscale")}
              style={{
                animationPlayState: isAnimationPaused ? "paused" : "running",
              }}
            />

            {/* Music notes animation */}
            {isPlaying && !isMuted && (
              <div className="absolute -top-2 -right-2">
                <Music className="w-4 h-4 text-yellow-400 animate-bounce" />
              </div>
            )}
          </div>
        </div>

        {/* Now Playing Message */}
        {audioLoaded && isPlaying && (
          <div className="mb-3 px-2">
            <div className="text-xs text-gray-400 mb-1">Now Playing:</div>
            <div
              className={cn(
                "text-xs text-white font-medium leading-tight",
                "bg-gradient-to-r from-blue-600/20 to-purple-600/20",
                "rounded-lg p-2 border border-blue-500/30",
                "min-h-[2.5rem] flex items-center",
              )}
              key={currentMessageIndex} // Force re-render for animation
            >
              <div className="animate-fade-in">{sampleMessages[currentMessageIndex]}</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause radio" : "Play radio"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute radio" : "Mute radio"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
            onClick={hideRadio}
            aria-label="Close radio"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Expanded Controls */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="text-xs text-gray-400 mb-2">Volume</div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => {
                const newVolume = Number.parseFloat(e.target.value)
                setVolume(newVolume)
                if (audioRef.current) {
                  audioRef.current.volume = newVolume
                }
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>{Math.round(volume * 100)}%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Floating Lyrics (Mobile Optimized) */}
        {audioLoaded && isPlaying && !isExpanded && (
          <div
            className={cn(
              "absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full",
              "w-40 sm:w-48 md:w-64 bg-gradient-to-r from-blue-600 to-purple-600",
              "text-white text-xs font-medium py-2 px-3 rounded-l-full",
              "shadow-lg border border-white/20",
              "transition-all duration-300 ease-in-out",
              "hidden sm:block", // Hide on very small screens
            )}
          >
            <div className="whitespace-nowrap overflow-hidden" key={currentMessageIndex}>
              <div className="animate-marquee">{sampleMessages[currentMessageIndex]}</div>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for animations and slider */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-marquee {
          animation: marquee 12s linear infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        @media (max-width: 768px) {
          .animate-marquee {
            animation-duration: 8s;
          }
        }
        
        @media (max-width: 480px) {
          .animate-marquee {
            animation-duration: 6s;
          }
        }
      `}</style>
    </div>
  )
}
