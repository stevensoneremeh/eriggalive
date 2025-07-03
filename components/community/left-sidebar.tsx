"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { CommunityCategory } from "@/types/database"
import { Tag, MessageSquare, Calendar, LayoutGrid, Flame } from "lucide-react"

interface LeftSidebarProps {
  categories: CommunityCategory[]
  currentCategorySlug?: string
}

const categoryIcons: Record<string, React.ElementType> = {
  bars: Flame,
  stories: MessageSquare,
  events: Calendar,
  general: LayoutGrid,
}

export function LeftSidebar({ categories, currentCategorySlug }: LeftSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(name, value)
    } else {
      params.delete(name)
    }
    return params.toString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Tag className="mr-2 h-5 w-5 text-primary" />
          Categories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link href={`${pathname}?${createQueryString("category", "")}`} passHref>
          <Button variant={!currentCategorySlug ? "secondary" : "ghost"} className="w-full justify-start">
            All Posts
          </Button>
        </Link>
        {categories.map((category) => {
          const Icon = categoryIcons[category.slug] || Tag
          return (
            <Link key={category.id} href={`${pathname}?${createQueryString("category", category.slug)}`} passHref>
              <Button
                variant={currentCategorySlug === category.slug ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Icon className="mr-2 h-4 w-4" />
                {category.name}
              </Button>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function LeftSidebarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 w-full bg-muted rounded animate-pulse"></div>
        ))}
      </CardContent>
    </Card>
  )
}
