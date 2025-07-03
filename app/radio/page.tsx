"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Volume2, Heart, Share2, Radio } from "lucide-react"
import { useState } from "react"

export default function RadioPage() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Radio className="h-10 w-10 text-orange-500" />
            Erigga Live Radio
          </h1>
          <p className="text-muted-foreground text-lg">
            24/7 non-stop Erigga hits, exclusive tracks, and fan favorites
          </p>
          <Badge variant="secondary" className="mt-2 bg-red-500 text-white animate-pulse">
            🔴 LIVE NOW
          </Badge>
        </div>

        <Card className="mb-8 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardHeader className="text-center">
            <div className="w-48 h-48 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Radio className="h-24 w-24 text-white" />
            </div>
            <CardTitle className="text-2xl">Now Playing</CardTitle>
            <CardDescription className="text-lg">"Paper Boi" - Erigga ft. Yung6ix</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex justify-center items-center gap-4">
              <Button
                size="lg"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </Button>
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Like
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Volume2 className="h-4 w-4 mr-2" />
                Volume
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Coming up next:</p>
              <ul className="space-y-1 text-sm">
                <li>• "The Erigma" - Erigga</li>
                <li>• "Motivation" - Erigga ft. Victor AD</li>
                <li>• "Area to the World" - Erigga</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>What's playing when</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-orange-500/10 rounded">
                  <span className="font-medium">6:00 AM - 12:00 PM</span>
                  <span className="text-sm text-muted-foreground">Morning Hits</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="font-medium">12:00 PM - 6:00 PM</span>
                  <span className="text-sm text-muted-foreground">Afternoon Vibes</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="font-medium">6:00 PM - 12:00 AM</span>
                  <span className="text-sm text-muted-foreground">Evening Mix</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="font-medium">12:00 AM - 6:00 AM</span>
                  <span className="text-sm text-muted-foreground">Late Night</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request a Song</CardTitle>
              <CardDescription>Want to hear something specific?</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Premium members can request songs to be played on the radio. Upgrade your account to unlock this
                feature!
              </p>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                Upgrade to Premium
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
