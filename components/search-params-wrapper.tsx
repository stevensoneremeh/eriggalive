"use client"

import type React from "react"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

interface SearchParamsWrapperProps {
  children: (searchParams: URLSearchParams) => React.ReactNode
  fallback?: React.ReactNode
}

function SearchParamsContent({ children }: { children: (searchParams: URLSearchParams) => React.ReactNode }) {
  const searchParams = useSearchParams()
  return <>{children(searchParams)}</>
}

export function SearchParamsWrapper({ children, fallback = null }: SearchParamsWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      <SearchParamsContent>{children}</SearchParamsContent>
    </Suspense>
  )
}
