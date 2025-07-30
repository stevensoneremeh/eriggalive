"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { SimpleLoading } from "@/components/simple-loading"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <SimpleLoading />
  }

  return <>{children}</>
}
