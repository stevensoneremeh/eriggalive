import type React from "react"
// Remove this file entirely to ensure main layout takes effect
// This prevents the community page from having its own layout that might hide the navbar

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Simply return children without any wrapper to use main layout
  return <>{children}</>
}
