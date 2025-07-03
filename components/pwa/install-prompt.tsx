"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Download, Smartphone, Monitor } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show install prompt after user has been on site for 30 seconds
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 30000)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      toast({
        title: "App Installed! 🎉",
        description: "EriggaLive has been added to your home screen.",
      })
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [toast])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      toast({
        title: "Installing App...",
        description: "EriggaLive is being added to your device.",
      })
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Don't show again for 7 days
    localStorage.setItem("installPromptDismissed", Date.now().toString())
  }

  // Don't show if recently dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem("installPromptDismissed")
    if (dismissed) {
      const dismissedTime = Number.parseInt(dismissed)
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      if (dismissedTime > sevenDaysAgo) {
        setShowInstallPrompt(false)
      }
    }
  }, [])

  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Install EriggaLive App
          </DialogTitle>
          <DialogDescription>
            Get the full experience with our mobile app. Access your favorite content faster and get notifications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <Smartphone className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Mobile Optimized</span>
              <span className="text-xs text-muted-foreground text-center">Perfect for on-the-go browsing</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <Monitor className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Desktop Ready</span>
              <span className="text-xs text-muted-foreground text-center">Full-featured experience</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleInstallClick} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Install App
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              <X className="mr-2 h-4 w-4" />
              Not Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
