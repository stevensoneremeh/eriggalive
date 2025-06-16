"use client"

import { Suspense, type ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface SearchParamsWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

function SearchParamsWrapper({ children, fallback }: SearchParamsWrapperProps) {
  return (
    <Suspense
      fallback={
        fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <div className="space-y-4 w-full max-w-md">
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        )
      }
    >
      {children}
    </Suspense>
  )
}

// Named export
export { SearchParamsWrapper }

// Default export
export default SearchParamsWrapper
