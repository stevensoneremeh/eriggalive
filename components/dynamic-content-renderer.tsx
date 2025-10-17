
```typescript
"use client"

import { DynamicContent } from "@/hooks/use-dynamic-content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DynamicContentRendererProps {
  content: DynamicContent
  className?: string
}

export function DynamicContentRenderer({ content, className }: DynamicContentRendererProps) {
  const renderByType = () => {
    switch (content.section_type) {
      case "hero":
        return (
          <section className={cn("relative min-h-[500px] flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 text-white", className)}>
            {content.image_url && (
              <div className="absolute inset-0 z-0">
                <img src={content.image_url} alt={content.title} className="w-full h-full object-cover opacity-30" />
              </div>
            )}
            <div className="relative z-10 container mx-auto px-4 text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">{content.title}</h1>
              {content.subtitle && <p className="text-xl md:text-2xl mb-6">{content.subtitle}</p>}
              {content.content_text && <p className="text-lg mb-8 max-w-2xl mx-auto">{content.content_text}</p>}
              {content.button_text && content.button_link && (
                <Button asChild size="lg">
                  <Link href={content.button_link}>{content.button_text}</Link>
                </Button>
              )}
            </div>
            {content.custom_css && <style>{content.custom_css}</style>}
          </section>
        )

      case "featured":
        return (
          <section className={cn("py-12 bg-muted/50", className)}>
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">{content.title}</h2>
                {content.subtitle && <p className="text-muted-foreground text-lg">{content.subtitle}</p>}
              </div>
              {content.image_url && (
                <div className="max-w-4xl mx-auto mb-6">
                  <img src={content.image_url} alt={content.title} className="w-full rounded-lg shadow-lg" />
                </div>
              )}
              {content.content_text && (
                <div className="max-w-3xl mx-auto prose dark:prose-invert">
                  <p className="text-lg leading-relaxed">{content.content_text}</p>
                </div>
              )}
              {content.button_text && content.button_link && (
                <div className="text-center mt-8">
                  <Button asChild>
                    <Link href={content.button_link}>{content.button_text}</Link>
                  </Button>
                </div>
              )}
            </div>
            {content.custom_css && <style>{content.custom_css}</style>}
          </section>
        )

      case "about":
      case "services":
        return (
          <section className={cn("py-12", className)}>
            <div className="container mx-auto px-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{content.title}</CardTitle>
                  {content.subtitle && <CardDescription className="text-lg">{content.subtitle}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-4">
                  {content.image_url && (
                    <img src={content.image_url} alt={content.title} className="w-full h-64 object-cover rounded-lg" />
                  )}
                  {content.content_text && (
                    <p className="leading-relaxed whitespace-pre-wrap">{content.content_text}</p>
                  )}
                  {content.button_text && content.button_link && (
                    <Button asChild>
                      <Link href={content.button_link}>{content.button_text}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
            {content.custom_css && <style>{content.custom_css}</style>}
          </section>
        )

      case "cta":
        return (
          <section className={cn("py-16 bg-gradient-to-r from-orange-500 to-red-600 text-white", className)}>
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.title}</h2>
              {content.subtitle && <p className="text-xl mb-2">{content.subtitle}</p>}
              {content.content_text && <p className="text-lg mb-8 max-w-2xl mx-auto">{content.content_text}</p>}
              {content.button_text && content.button_link && (
                <Button asChild size="lg" variant="secondary">
                  <Link href={content.button_link}>{content.button_text}</Link>
                </Button>
              )}
            </div>
            {content.custom_css && <style>{content.custom_css}</style>}
          </section>
        )

      case "custom":
      default:
        return (
          <section className={cn("py-12", className)}>
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-4">{content.title}</h2>
              {content.subtitle && <p className="text-lg text-muted-foreground mb-4">{content.subtitle}</p>}
              {content.image_url && (
                <img src={content.image_url} alt={content.title} className="w-full max-w-2xl mx-auto mb-6 rounded-lg" />
              )}
              {content.content_text && (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{content.content_text}</p>
                </div>
              )}
              {content.button_text && content.button_link && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href={content.button_link}>{content.button_text}</Link>
                  </Button>
                </div>
              )}
            </div>
            {content.custom_css && <style>{content.custom_css}</style>}
          </section>
        )
    }
  }

  return renderByType()
}

interface DynamicContentListProps {
  content: DynamicContent[]
  className?: string
}

export function DynamicContentList({ content, className }: DynamicContentListProps) {
  if (!content || content.length === 0) {
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
```
