"use client"

import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Route-level loading UI for /community
 * Ensures components that use `useSearchParams()` are wrapped
 * in a Suspense boundary during streaming / RSC rendering.
 */
export default function CommunityLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading community…</span>
        </CardContent>
      </Card>
    </div>
  )
}
