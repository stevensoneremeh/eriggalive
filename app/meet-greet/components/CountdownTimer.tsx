"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Zap } from "lucide-react"

interface CountdownTimerProps {
  targetTime: Date
  onComplete: () => void
}

export function CountdownTimer({ targetTime, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    minutes: 0,
    seconds: 0,
    total: 0,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const target = targetTime.getTime()
      const difference = target - now

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({
          minutes,
          seconds,
          total: difference,
        })
      } else {
        setTimeLeft({ minutes: 0, seconds: 0, total: 0 })
        onComplete()
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetTime, onComplete])

  const formatNumber = (num: number) => num.toString().padStart(2, "0")

  if (timeLeft.total <= 0) {
    return (
      <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
            <Zap className="h-5 w-5" />
            <span className="font-bold">Session Starting Now!</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
      <CardContent className="p-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Session starts in</span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(timeLeft.minutes)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Minutes</div>
            </div>

            <div className="text-2xl font-bold text-gray-400">:</div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(timeLeft.seconds)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Seconds</div>
            </div>
          </div>

          <Badge className="mt-3 bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">Get Ready!</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
