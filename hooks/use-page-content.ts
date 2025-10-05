
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface PageContent {
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

export function usePageContent(pageName: string) {
  const [content, setContent] = useState<PageContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContent() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('page_content')
          .select('*')
          .eq('page_name', pageName)
          .eq('is_active', true)
          .order('section_order', { ascending: true })

        if (error) throw error
        setContent(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [pageName])

  return { content, loading, error }
}
