"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface CountdownTimerProps {
  initialTime: number // in seconds
  onTimeUp: () => void
  onTimeUpdate: (time: number) => void
}

export default function CountdownTimer({ initialTime, onTimeUp, onTimeUpdate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime)

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1
        onTimeUpdate(newTime)
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onTimeUp, onTimeUpdate])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getTimerColor = () => {
    if (timeLeft <= 60) return "text-red-500" // Last minute
    if (timeLeft <= 300) return "text-yellow-500" // Last 5 minutes
    return "text-green-500"
  }

  return (
    <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
      <Clock className={`w-4 h-4 ${getTimerColor()}`} />
      <span className={`font-mono text-lg font-bold ${getTimerColor()}`}>{formatTime(timeLeft)}</span>
    </div>
  )
}
