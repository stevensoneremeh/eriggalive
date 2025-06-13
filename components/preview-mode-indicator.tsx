"use client"

import { useState } from "react"
import { AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PreviewModeIndicator() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-orange-100 dark:bg-orange-900/80 border border-orange-300 dark:border-orange-700 rounded-lg shadow-lg z-50">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">Preview Mode Active</h3>
            <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
              <p>
                You're viewing the application in preview mode. Some features like video playback, authentication, and
                database connections are limited or simulated.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Videos may not autoplay in this environment</li>
                <li>Authentication uses mock data</li>
                <li>Database operations are simulated</li>
              </ul>
              <p className="mt-2 font-medium">Deploy to Vercel for full functionality.</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-4 -mt-1 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800/50"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
