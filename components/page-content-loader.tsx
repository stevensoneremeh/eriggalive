
"use client"

import { useEffect, useState } from "react"
import { DynamicContentRenderer } from "./dynamic-content-renderer"
import { Skeleton } from "./ui/skeleton"

interface PageContentLoaderProps {
  pageName: string
  className?: string
}

export function PageContentLoader({ pageName, className }: PageContentLoaderProps) {
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(`/api/admin/content?page=${pageName}`)
        const data = await response.json()
        setContent(data.content || [])
      } catch (error) {
        console.error("Failed to load content:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [pageName])

  if (loading) {
    return (
      <div className={className}>
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (content.length === 0) {
    return null
  }

  return (
    <div className={className}>
      {content
        .filter(item => item.is_active)
        .sort((a, b) => a.section_order - b.section_order)
        .map((item) => (
          <DynamicContentRenderer key={item.id} content={item} />
        ))}
    </div>
  )
}
