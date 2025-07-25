"use client"

import { Clock, AlertTriangle } from "lucide-react"

interface CountdownTimerProps {
  timeRemaining: number // in seconds
  totalDuration: number // in seconds
}

export function CountdownTimer({ timeRemaining, totalDuration }: CountdownTimerProps) {
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const percentage = (timeRemaining / totalDuration) * 100

  const getTimerColor = () => {
    if (percentage > 50) return "text-green-400"
    if (percentage > 25) return "text-yellow-400"
    return "text-red-400"
  }

  const getBackgroundColor = () => {
    if (percentage > 50) return "bg-green-400"
    if (percentage > 25) return "bg-yellow-400"
    return "bg-red-400"
  }

  return (
    <div className="flex items-center gap-3">
      {/* Progress Ring */}
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-700"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={getTimerColor()}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock className={`h-4 w-4 ${getTimerColor()}`} />
        </div>
      </div>

      {/* Time Display */}
      <div className="text-right">
        <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
        <div className="text-xs text-slate-400">Time Remaining</div>
      </div>

      {/* Warning Icon for last 2 minutes */}
      {timeRemaining <= 120 && (
        <AlertTriangle
          className={`h-5 w-5 animate-pulse ${timeRemaining <= 60 ? "text-red-400" : "text-yellow-400"}`}
        />
      )}
    </div>
  )
}
