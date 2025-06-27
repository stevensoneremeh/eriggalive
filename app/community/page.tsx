import { Suspense } from "react"
import { CommunityPageClient } from "./community-page-client"

export default function CommunityPage() {
  return (
    <Suspense fallback={<div>Loading community...</div>}>
      <CommunityPageClient />
    </Suspense>
  )
}
