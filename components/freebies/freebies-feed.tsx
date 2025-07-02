"use client"

import type React from "react"

import type { Freebie } from "@/types"
import FreebieCard from "./freebie-card"
import { useEffect, useState } from "react"
import supabase from "@/lib/supabase/client"

interface FreebiesFeedProps {
  category?: string
}

const FreebiesFeed: React.FC<FreebiesFeedProps> = ({ category }) => {
  const [freebies, setFreebies] = useState<Freebie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFreebies = async () => {
      setLoading(true)
      let query = supabase.from("freebies").select("*").order("created_at", { ascending: false })

      if (category) {
        query = query.eq("category", category)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching freebies:", error)
      } else {
        setFreebies(data || [])
      }
      setLoading(false)
    }

    fetchFreebies()
  }, [category])

  if (loading) {
    return <div>Loading freebies...</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {freebies.map((freebie) => (
        <FreebieCard key={freebie.id} freebie={freebie} />
      ))}
    </div>
  )
}

export default FreebiesFeed
