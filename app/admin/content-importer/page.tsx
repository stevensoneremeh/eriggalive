
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Upload, CheckCircle, Loader2 } from "lucide-react"

const HOMEPAGE_CONTENT = [
  {
    page_name: "homepage",
    page_title: "Welcome to Erigga Live",
    section_type: "hero",
    title: "The Paperboi Community",
    subtitle: "Your Gateway to Exclusive Erigga Content",
    content_text: "Join the most vibrant community of Erigga fans. Access exclusive music, live events, and connect with fellow paper soldiers.",
    image_url: "/erigga/hero/erigga-main-hero.jpeg",
    button_text: "Join Now",
    button_link: "/signup",
    section_order: 0,
    is_active: true
  },
  {
    page_name: "homepage",
    section_type: "featured",
    title: "Latest Releases",
    subtitle: "Stream New Music",
    content_text: "Get instant access to Erigga's latest tracks, albums, and exclusive content before anyone else.",
    button_text: "Explore Vault",
    button_link: "/vault",
    section_order: 1,
    is_active: true
  },
  {
    page_name: "homepage",
    section_type: "stats",
    title: "Join Over 100,000 Paper Soldiers",
    content_text: "Be part of the fastest growing Afrobeats community",
    section_order: 2,
    is_active: true
  }
]

const ABOUT_CONTENT = [
  {
    page_name: "about",
    page_title: "About Erigga",
    section_type: "hero",
    title: "The Paperboi Story",
    subtitle: "From Warri to the World",
    content_text: "Erhiga Agarivbie, known professionally as Erigga, is a Nigerian rapper and songwriter from Warri, Delta State.",
    image_url: "/erigga/performances/erigga-live-performance.jpeg",
    section_order: 0,
    is_active: true
  },
  {
    page_name: "about",
    section_type: "about",
    title: "Early Career",
    content_text: "Erigga began his music career in 2010, gaining recognition for his unique style that blends street narratives with commercial appeal.",
    image_url: "/erigga/early-career/erigga-airport-journey.jpeg",
    section_order: 1,
    is_active: true
  },
  {
    page_name: "about",
    section_type: "about",
    title: "Awards & Recognition",
    content_text: "Multiple award winner including Headies Awards and recognition across the Nigerian music industry.",
    image_url: "/erigga/awards/erigga-award-ceremony.jpeg",
    section_order: 2,
    is_active: true
  }
]

const EVENTS_CONTENT = [
  {
    page_name: "events",
    page_title: "Upcoming Events",
    section_type: "hero",
    title: "Live Events & Concerts",
    subtitle: "Experience Erigga Live",
    content_text: "Get tickets to exclusive concerts, meet and greets, and virtual sessions.",
    button_text: "View Events",
    button_link: "/events",
    section_order: 0,
    is_active: true
  }
]

const VAULT_CONTENT = [
  {
    page_name: "vault",
    page_title: "Media Vault",
    section_type: "hero",
    title: "Exclusive Media Vault",
    subtitle: "Premium Content for Tier Members",
    content_text: "Access exclusive music, videos, behind-the-scenes content and more based on your membership tier.",
    button_text: "Explore Vault",
    button_link: "/vault",
    section_order: 0,
    is_active: true
  }
]

const PREMIUM_CONTENT = [
  {
    page_name: "premium",
    page_title: "Premium Membership",
    section_type: "hero",
    title: "Upgrade Your Experience",
    subtitle: "Unlock Exclusive Benefits",
    content_text: "Join Pioneer, Elder, or Blood tier for exclusive access to premium content, early releases, and special perks.",
    button_text: "View Plans",
    button_link: "/premium",
    section_order: 0,
    is_active: true
  }
]

export default function ContentImporterPage() {
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState<string[]>([])

  const importContent = async (contentArray: any[], pageName: string) => {
    try {
      for (const item of contentArray) {
        const response = await fetch("/api/admin/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        })
        
        if (!response.ok) throw new Error(`Failed to import ${pageName}`)
      }
      
      setImported(prev => [...prev, pageName])
      toast.success(`${pageName} content imported successfully`)
    } catch (error) {
      toast.error(`Failed to import ${pageName} content`)
    }
  }

  const importAllContent = async () => {
    setImporting(true)
    setImported([])
    
    await importContent(HOMEPAGE_CONTENT, "Homepage")
    await importContent(ABOUT_CONTENT, "About")
    await importContent(EVENTS_CONTENT, "Events")
    await importContent(VAULT_CONTENT, "Vault")
    await importContent(PREMIUM_CONTENT, "Premium")
    
    setImporting(false)
    toast.success("All content imported successfully!")
  }

  const pages = [
    { name: "Homepage", content: HOMEPAGE_CONTENT },
    { name: "About", content: ABOUT_CONTENT },
    { name: "Events", content: EVENTS_CONTENT },
    { name: "Vault", content: VAULT_CONTENT },
    { name: "Premium", content: PREMIUM_CONTENT },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Importer</h1>
        <p className="text-muted-foreground">Import existing UI content into the content management system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Import</CardTitle>
          <CardDescription>Import all existing page content with one click</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={importAllContent} 
            disabled={importing}
            size="lg"
            className="w-full sm:w-auto"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import All Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Individual Page Import</CardTitle>
          <CardDescription>Import content for specific pages</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {pages.map((page) => (
                <div key={page.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{page.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {page.content.length} content section{page.content.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {imported.includes(page.name) ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => importContent(page.content, page.name)}
                      disabled={importing}
                    >
                      Import
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview Content Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <pre className="text-xs">
              {JSON.stringify([...HOMEPAGE_CONTENT, ...ABOUT_CONTENT], null, 2)}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
