"use client"

import type React from "react"

import { Suspense } from "react"

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
