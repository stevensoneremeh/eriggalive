"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => {
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return setOk(false)

      const { data, error } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

      if (error || !data || data.role !== "admin") {
        setOk(false)
      } else {
        setOk(true)
      }
    })()
  }, [supabase])

  if (ok === null) return <div className="p-6">Loading...</div>
  if (ok === false) return <div className="p-6">Unauthorized</div>

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        <h2 className="font-semibold text-lg">Admin Panel</h2>
        <nav className="flex flex-col gap-2">
          <Link href="/admin" className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            Overview
          </Link>
          <Link href="/admin/media" className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            Media
          </Link>
          <Link
            href="/admin/branding"
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            Branding
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
