
```typescript
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DynamicContent {
  id: string
  page_name: string
  page_title: string
  section_type: string
  title: string
  subtitle?: string
  content_text?: string
  image_url?: string
  video_url?: string
  button_text?: string
  button_link?: string
  section_order: number
  is_active: boolean
  custom_css?: string
  metadata?: any
}

export function useDynamicContent(pageName: string) {
  const [content, setContent] = useState<DynamicContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(`/api/admin/content?page=${pageName}`)
        const data = await response.json()
        
        if (data.content) {
          setContent(data.content)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [pageName])

  // Group content by section type
  const contentByType = content.reduce((acc, item) => {
    if (!acc[item.section_type]) {
      acc[item.section_type] = []
    }
    acc[item.section_type].push(item)
    return acc
  }, {} as Record<string, DynamicContent[]>)

  return { 
    content, 
    contentByType,
    loading, 
    error,
    hasContent: content.length > 0
  }
}
```
