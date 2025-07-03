"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function SignUpSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard")
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Erigga Live!</CardTitle>
          <CardDescription>
            Your account has been created successfully. You're now part of the movement!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>🎉 You've received 100 welcome coins!</p>
            <p>🎵 Access to exclusive content</p>
            <p>💬 Join the community discussions</p>
          </div>
          <Button onClick={() => router.push("/dashboard")} className="w-full">
            Get Started
          </Button>
          <p className="text-xs text-muted-foreground">Redirecting automatically in 5 seconds...</p>
        </CardContent>
      </Card>
    </div>
  )
}
